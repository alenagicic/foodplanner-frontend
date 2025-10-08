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

// Utility to format date string to 'day shortMonth year' in Swedish locale
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

// Utility to get a card title, falling back to a truncated ID if the title is empty
const getCardTitle = (recipe: Recipe) => {
    return recipe.title.trim() || `Recept #${recipe.id.slice(0, 8)}`;
};

// Utility to get the main image URL, falling back to a default image
const getCardImageUrl = (recipe: Recipe) => {
    return recipe.imageUrls?.[0] || img;
};

// Utility to get the tags, defaulting to an empty array
const getCardTags = (recipe: Recipe) => {
    return recipe.tag || [];
};

interface TagRendererProps {
    tags?: string[];
    className: string;
}

// Component for rendering recipe tags
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

// Modal component to display full recipe details
const RecipeModal = ({ recipe, mainImageUrl, closeModal, handleThumbnailClick }: RecipeModalProps) => {
    const { title, imageUrls, tag, bodyrecipe, created } = recipe;

    // Effect to control scrolling when the modal is open
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
                    &times;
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

                <div className="modal-section">
                    <h3>Skapad</h3>
                    <p>{formatDate(created)}</p>
                </div>

                <div className="modal-section">
                    <h3>Kategori</h3>
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

// Main component for browsing recipes
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

    // Function to fetch a page of recipes, memoized
    const fetchPage = useCallback(async (
        tag: string,
        limit: number,
        lastPK: string | null,
        lastSK: string | null,
        isInitial: boolean
    ) => {
        if (loading || (!isInitial && !hasMore)) return;

        console.log("fetched")
        
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

    // Initial load and dependency on search term change
    useEffect(() => {
        // Only fetch if it's the initial load for the current search term and there might be more results
        if (recipes.length === 0 && hasMore && !loading) {
            const tagToFetch = currentSearchTerm;
            fetchPage(tagToFetch, PAGE_SIZE, null, null, true);
        }
    }, [currentSearchTerm, hasMore, recipes.length, fetchPage, loading]);

    // Handler for the search form submission
    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTag = searchTag.trim().toLowerCase();

        if (trimmedTag === currentSearchTerm) return;

        // Reset state for a new search
        setRecipes([]);
        setNextPK(null);
        setNextSK(null);
        setHasMore(true);

        setCurrentSearchTerm(trimmedTag);
    };

    // Handler for the 'Load More' button
    const handleLoadMore = () => {
        if (!hasMore || loading || !nextPK || !nextSK) return;

        fetchPage(currentSearchTerm, PAGE_SIZE, nextPK, nextSK, false);
    };

    // Toggles the display of images on recipe cards
    const toggleImageDisplay = () => {
        setShowImages(prev => !prev);
    };

    // Opens the recipe modal
    const openModal = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setCurrentModalImageUrl(getCardImageUrl(recipe));
    };

    // Closes the recipe modal
    const closeModal = () => {
        setSelectedRecipe(null);
        setCurrentModalImageUrl('');
    };

    // Handles clicking on a thumbnail inside the modal
    const handleThumbnailClick = (imageUrl: string) => {
        setCurrentModalImageUrl(imageUrl);
    };

    // Renders the message when no recipes are found
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
                    aria-label="Sök efter receptkategori"
                />
                <button type="submit" className="btn-actual btn-search" disabled={loading}>
                    Sök
                </button>
            </form>

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
                        key={recipe.id}
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

                            <h4>Kategori</h4>
                            <TagRenderer tags={getCardTags(recipe)} className="recipe-card__tags" />

                            <div className="create-recipe-card">
                                <h4>Skapad:</h4>
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
}