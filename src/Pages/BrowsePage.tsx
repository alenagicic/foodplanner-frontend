import { useEffect, useState, useCallback } from "react";
import { fetchRecipesListPaginated } from "../Utils/api";
import type { Recipe } from "../Utils/api";
import img from "../Images/cook.png";

interface PaginatedRecipes {
    recipes: Recipe[];
    nextPK: string;
    nextSK: string;
}

const PAGE_SIZE = 10;

const formatDate = (dateString: string) => {
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

const getCardTitle = (recipe: Recipe) => {
    return recipe.title.trim() || `Recept #${recipe.id.slice(0, 8)}`;
};

const getCardImageUrl = (recipe: Recipe) => {
    return recipe.imageUrls?.[0] || img;
};

const getCardTags = (recipe: Recipe) => {
    return recipe.tag || [];
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

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closeModal}>
                    &times;
                </button>

                <h2 className="modal-title">{title}</h2>

                <div className="modal-image-gallery">
                    <div className="modal-image-container">
                        <img src={mainImageUrl} alt={title} className="modal-image" />
                    </div>

                    {imageUrls && imageUrls.length > 1 && (
                        <div className="modal-section modal-thumbnails-section">
                            <h3>Välj bild</h3>
                            <div className="modal-thumbnail-grid">
                                {imageUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`${title} bild ${index + 1}`}
                                        className={`modal-thumbnail ${url === mainImageUrl ? 'is-active' : ''}`}
                                        onClick={() => handleThumbnailClick(url)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-section">
                    <h3>Skapad</h3>
                    <p>{formatDate(created)}</p>
                </div>

                <div className="modal-section">
                    <h3>Kategori</h3>
                    <TagRenderer tags={tag} className="tag-list" />
                </div>

                <div className="modal-section">
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

export default function Browsepage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);

    const [nextPK, setNextPK] = useState<string | null>(null);
    const [nextSK, setNextSK] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const [searchTag, setSearchTag] = useState<string>("");
    const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [currentModalImageUrl, setCurrentModalImageUrl] = useState<string>('');
    const [showImages, setShowImages] = useState(true);

    const fetchPage = useCallback(async (
        tag: string,
        limit: number,
        lastPK: string | null,
        lastSK: string | null,
        isInitial: boolean
    ) => {
        if (loading || (!isInitial && !hasMore)) return;

        setLoading(true);

        const data: PaginatedRecipes | undefined = await fetchRecipesListPaginated(
            tag,
            limit,
            lastPK || "",
            lastSK || ""
        );

        if (data && data.recipes.length > 0) {
            setRecipes((prevRecipes) => (isInitial ? data.recipes : [...prevRecipes, ...data.recipes]));
            setNextPK(data.nextPK || null);
            setNextSK(data.nextSK || null);
            setHasMore(!!data.nextPK);
        } else {
            setHasMore(false);
            if (isInitial) {
                setRecipes([]);
            }
        }

        setLoading(false);
    }, [loading, hasMore]);

    useEffect(() => {
        if (recipes.length === 0 && hasMore) {
            const tagToFetch = currentSearchTerm;
            fetchPage(tagToFetch, PAGE_SIZE, null, null, true);
        }
    }, [currentSearchTerm, hasMore, recipes.length, fetchPage]);


    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTag = searchTag.trim().toLowerCase();

        if (trimmedTag === currentSearchTerm) return;

        setRecipes([]);
        setNextPK(null);
        setNextSK(null);
        setHasMore(true);

        setCurrentSearchTerm(trimmedTag);
    };

    const handleLoadMore = () => {
        if (!hasMore || loading || !nextPK || !nextSK) return;

        fetchPage(currentSearchTerm, PAGE_SIZE, nextPK, nextSK, false);
    };

    const toggleImageDisplay = () => {
        setShowImages(prev => !prev);
    };

    const openModal = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setCurrentModalImageUrl(getCardImageUrl(recipe));
    };

    const closeModal = () => {
        setSelectedRecipe(null);
        setCurrentModalImageUrl('');
    };

    const handleThumbnailClick = (imageUrl: string) => {
        setCurrentModalImageUrl(imageUrl);
    };


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
                    onChange={(e) => setSearchTag(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="btn-actual btn-search" disabled={loading}>
                    Sök
                </button>
            </form>

            {recipes.length > 0 && (
                <button className="btn-toggle-images btn-actual" onClick={toggleImageDisplay}>
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
                        key={recipe.id}
                        className={`recipe-card ${!showImages ? 'no-image-mode' : ''}`}
                        onClick={() => openModal(recipe)}
                        role="button"
                        tabIndex={0}
                    >
                        {showImages && (
                            <div className="recipe-card__image-container">
                                <img
                                    src={getCardImageUrl(recipe)}
                                    alt={getCardTitle(recipe)}
                                    className="recipe-card__image"
                                />
                            </div>
                        )}

                        <div className="recipe-card__content">
                            <h3 className="recipe-card__title">{getCardTitle(recipe)}</h3>

                            <h4>Skapad</h4>
                            <p className="recipe-card__created-date">{formatDate(recipe.created)}</p>

                            <h4>Kategori</h4>
                            <TagRenderer tags={getCardTags(recipe)} className="recipe-card__tags" />
                        </div>
                    </div>
                ))}
            </div>

            {recipes.length > 0 && hasMore && (
                <button className="btn-actual btn-browse" onClick={handleLoadMore} disabled={loading}>
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
}