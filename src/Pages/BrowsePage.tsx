import type { Recipe } from "../Utils/api";
import { TagSuggestions, removeArticle } from "../Utils/api";
import { useRecipeBrowser, getCardTitle, getCardTags, getCardImageUrl } from "../Hooks/useRecipeBrowser";
import { useEffect, useState, useCallback } from "react";

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return "Okänt datum";
    }
};

interface TagRendererProps {
    tags?: string[];
    className: string;
}

const TagRenderer = ({ tags, className }: TagRendererProps) => {
    const tagList = tags || [];
    if (tagList.length === 0) {
        return <span className="no-tags">Inga taggar</span>;
    }
    return (
        <div className={className}>
            {tagList.slice(0, 4).map((tag, index) => (
                <span className="tag-pill-detail" key={index}>{tag}</span>
            ))}
            {tagList.length > 4 && (
                <span className="tag-more-indicator">+{tagList.length - 4}</span>
            )}
        </div>
    );
};

interface RecipeModalProps {
    recipe: Recipe;
    mainImageUrl: string;
    closeModal: () => void;
    handleThumbnailClick: (url: string) => void;
}

const RecipeModal = ({ recipe, mainImageUrl, closeModal, handleThumbnailClick }: RecipeModalProps) => {
    const { title, imageUrls, tag, bodyrecipe, created } = recipe;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closeModal} aria-label="Stäng modal">
                    Stäng
                </button>

                <h2 className="modal-title">{title}</h2>

                <div className="modal-image-gallery">
                    <div className="modal-image-container">
                        <img src={mainImageUrl} alt={`Huvudbild för ${title}`} className="modal-image" loading="lazy" />
                    </div>

                    {imageUrls && imageUrls.length > 1 && (
                        <div className="modal-section modal-thumbnails-section">
                            <h3>Välj bild</h3>
                            <div className="modal-thumbnail-grid">
                                {imageUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`${title} miniatyrbild ${index + 1}`}
                                        className={`modal-thumbnail ${url === mainImageUrl ? 'is-active' : ''}`}
                                        onClick={() => handleThumbnailClick(url)}
                                        loading="lazy"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-section article-info">
                    <i className="bi bi-clock"></i>
                    <p>{formatDate(created)}</p>
                </div>

                <div className="modal-section article-info">
                    <i className="bi bi-tags"></i>
                    <TagRenderer tags={tag} className="tag-list" />
                </div>

                <div className="modal-section modal-recipe-body">
                    <h3>Recept</h3>
                    <div
                        className="modal-bodyrecipe"
                        dangerouslySetInnerHTML={{ __html: bodyrecipe }}
                    />
                </div>
            </div>
        </div>
    );
};

const removeArticleNelement = async (articleId: string, onRemovalSuccess: (id: string) => void, recipeTitle: string) => {
    const isConfirmed = window.confirm(`Är du säker på att du vill ta bort receptet "${recipeTitle}"? Detta kan inte ångras.`);
    
    if (isConfirmed) {
        const res = await removeArticle(articleId)

        if(res !== "" || undefined){
            console.log("article removed")
            onRemovalSuccess(articleId);
        }
    } else {
        console.log("Removal cancelled by user.");
    }
}

const Browsepage = () => {
    const {
        recipes,
        loading,
        hasMore,
        searchTag,
        currentSearchTerm,
        selectedRecipe,
        currentModalImageUrl,
        showImages,
        setSearchTag,
        handleSearch,
        handleLoadMore,
        toggleImageDisplay,
        openModal,
        closeModal,
        handleThumbnailClick,
        handleRecipeRemoval,
    } = useRecipeBrowser();

    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [debouncedSearchTag, setDebouncedSearchTag] = useState(searchTag);

    const onRemoveClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, recipe: Recipe) => {
        e.stopPropagation(); 
        const title = getCardTitle(recipe);
        removeArticleNelement(recipe.Id, handleRecipeRemoval, title);
    }, [handleRecipeRemoval]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTag(searchTag);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTag]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchSuggestions = async () => {
            if (!debouncedSearchTag.trim()) {
                setTagSuggestions([]);
                return;
            }

            try {
                const fetchedSuggestions = await TagSuggestions(debouncedSearchTag, signal); 
                if (!signal.aborted) {
                    setTagSuggestions(fetchedSuggestions);
                }
            } catch (error) {
                if ((error as any).name !== 'AbortError') {
                    console.error("Failed to fetch tag suggestions:", error);
                    setTagSuggestions([]);
                }
            }
        };

        fetchSuggestions();

        return () => {
            controller.abort();
        };
    }, [debouncedSearchTag]);

    const renderEmptyState = () => {
        if (!hasMore && !loading && recipes.length === 0) {
            if (currentSearchTerm) {
                return (
                    <div className="wrapper-notfound">
                        <p>
                            Hittade inga recept inom kategorin <b>{currentSearchTerm}</b>.
                        </p>
                    </div>
                );
            }
            return (
                <div className="wrapper-notfound">
                    <p>Inga recept hittades.</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="wrapper-page wrapper-browse">
            <h2>Sök kategori</h2>

            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="search"
                    placeholder="Sök"
                    value={searchTag}
                    onChange={(e) => {
                        setSearchTag(e.target.value);
                    }}
                    list="tag-suggestions"
                    className="search-input"
                    aria-label="Sök efter receptkategori"
                />
                <button type="submit" className="btn-actual btn-search" disabled={loading}>
                    Sök
                </button>
            </form>

            {tagSuggestions.length > 0 && (
                <datalist id="tag-suggestions">
                    {tagSuggestions.map((suggestion, index) => (
                        <option key={index} value={suggestion} />
                    ))}
                </datalist>
            )}

            {recipes.length > 0 && (
                <button className="btn-toggle-images btn-actual" onClick={toggleImageDisplay} aria-pressed={!showImages}>
                    {showImages ? 'Dölj bilder' : 'Visa bilder'}
                </button>
            )}

            {(loading && recipes.length === 0) && (
                <p className="loading-more-indicator wrapper-notfound">Laddar receptlista...</p>
            )}

            {renderEmptyState()}

            <div className="recipe-grid">
                {recipes.map((recipe) => (
                    <div
                        key={recipe.Id}
                        className={`recipe-card ${!showImages ? 'no-image-mode' : ''}`}
                        onClick={() => openModal(recipe)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                openModal(recipe);
                            }
                        }}
                    >
                        {showImages && (
                            <div className="recipe-card__image-container">
                                <img
                                    src={getCardImageUrl(recipe)}
                                    alt={getCardTitle(recipe)}
                                    className="recipe-card__image"
                                    loading="lazy"
                                />
                            </div>
                        )}

                        <div className="recipe-card__content">
                            <h3 className="recipe-card__title">{getCardTitle(recipe)}</h3>

                            <button 
                                onClick={(e) => onRemoveClick(e, recipe)}
                            >
                                <i>Ta bort</i>
                            </button>

                            <div className="create-recipe-categories">
                                <i className="bi bi-tags"></i>
                                <TagRenderer tags={getCardTags(recipe)} className="recipe-card__tags" />
                            </div>
                        
                            <div className="create-recipe-card">
                                <i className="bi bi-clock"></i>
                                <p className="recipe-card__created-date">{formatDate(recipe.created)}</p>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {recipes.length > 0 && hasMore && (
                <button className="btn-actual btn-browse" onClick={handleLoadMore} disabled={loading} aria-live="polite">
                    {loading ? 'Laddar fler...' : 'Ladda mera'}
                </button>
            )}

            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    mainImageUrl={currentModalImageUrl}
                    closeModal={closeModal}
                    handleThumbnailClick={handleThumbnailClick}
                />
            )}
        </div>
    );
};

export default Browsepage;