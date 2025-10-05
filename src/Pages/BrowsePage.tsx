import { useEffect, useState, useCallback } from "react";
import { fetchRecipesPaginated } from "../Utils/api";
import type { Recipe } from "../Utils/api";
import img from "../Images/cook.png";

interface PaginatedRecipes {
    recipes: Recipe[];
    nextPK: string;
    nextSK: string;
}

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

    const PAGE_SIZE = 10;

    const loadRecipes = useCallback(async (
        limit: number, 
        tag: string,
        lastPK: string | null, 
        lastSK: string | null
    ) => {
        const isNewSearch = lastPK === "" && lastSK === "";

        if (loading || (!hasMore && !isNewSearch)) return;
        
        if (!tag) {
             setRecipes([]);
             setHasMore(false);
             return;
        }

        setLoading(true);

        const data: PaginatedRecipes | undefined = await fetchRecipesPaginated(
             tag, 
             limit, 
             lastPK || "", 
             lastSK || ""
        );

        if (data) {
            setRecipes((prevRecipes) => {
                if (isNewSearch) {
                    return data.recipes;
                }
                return [...prevRecipes, ...data.recipes];
            });
            
            setNextPK(data.nextPK || null);
            setNextSK(data.nextSK || null); 
            setHasMore(!!data.nextPK);
        } else {
            setHasMore(false);
        }
        
        setLoading(false);
    }, [loading, hasMore]);

    useEffect(() => {
        if (currentSearchTerm) {
            loadRecipes(PAGE_SIZE, currentSearchTerm, null, null);
        }
    }, [currentSearchTerm, loadRecipes]);


    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const trimmedTag = searchTag.trim().toLowerCase();
    
        if (trimmedTag === currentSearchTerm && recipes.length > 0) return;

        setRecipes([]);
        setNextPK(null);
        setNextSK(null);
        setHasMore(true);
        
        setCurrentSearchTerm(trimmedTag);
    };

    const handleLoadMore = () => {
        if (!currentSearchTerm || !nextPK || !nextSK) return;
        
        loadRecipes(PAGE_SIZE, currentSearchTerm, nextPK, nextSK); 
    };

    const toggleImageDisplay = () => {
        setShowImages(prev => !prev);
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

    const renderTagsDetail = (tags?: string[]) => {
        const tagList = tags || [];
        
        if (tagList.length === 0) {
            return <p className="no-tags">Inga taggar tillgängliga.</p>;
        }
        return (
            <div className="tag-list">
                {tagList.map((tag, index) => (
                    <span className="tag-pill-detail" key={index}>{tag}</span>
                ))}
            </div>
        );
    };

    const renderRecipeDetails = () => {
        if (!selectedRecipe) return null;
        
        const { title, imageUrls, tag, bodyrecipe, created } = selectedRecipe; 
        
        const mainImage = currentModalImageUrl;

        return (
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={closeModal}>
                        &times;
                    </button>
                    
                    <h2 className="modal-title">{title}</h2>
                    
                    <div className="modal-image-gallery">
                        <div className="modal-image-container">
                            <img src={mainImage} alt={title} className="modal-image" />
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
                                            className={`modal-thumbnail ${url === currentModalImageUrl ? 'is-active' : ''}`}
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
                        {renderTagsDetail(tag)}
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
            
            {recipes.length === 0 && !loading && currentSearchTerm && (
                <div className="wrapper-notfound">
                    <p>
                        Hittade inga recept inom kategorin "{currentSearchTerm}".
                    </p>
                </div>
            )}

            <div className="recipe-grid">
                {recipes.length > 0 && recipes.map((recipe) => {
                    const cardTags = getCardTags(recipe);
                    
                    return (
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
                                <div className="recipe-card__tags">
                                    {cardTags.length > 0 ? (
                                        cardTags.slice(0, 4).map((tag, index) => (
                                            <span className="tag" key={index}>{tag}</span>
                                        ))
                                    ) : (
                                        <span className="no-tags">Inga taggar</span>
                                    )}
                                    {cardTags.length > 4 && (
                                        <span className="tag-more-indicator">+{cardTags.length - 4}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ÄNDRING 5: Visa endast knappen om det finns recept och det finns mer att ladda */}
            {recipes.length > 0 && hasMore && (
                <button className="btn-actual btn-browse" onClick={handleLoadMore} disabled={loading}>
                    {loading ? 'Laddar...' : 'Ladda mera'}
                </button>
            )}
            
            {loading && recipes.length > 0 && (
                <p className="loading-more-indicator">Laddar fler...</p>
            )}

            {selectedRecipe && renderRecipeDetails()}
        </div>
    );
}