import { useState, useCallback, useEffect } from "react";
import { fetchRecipesListPaginated } from "../Utils/api";
import type { Recipe } from "../Utils/api";
import img from "../Images/cook.png";

const PAGE_SIZE = 10;

interface PaginatedRecipes {
    recipes: Recipe[];
    nextPK: string;
    nextSK: string;
}

export const getCardImageUrl = (recipe: Recipe): string => {
    return recipe.imageUrls?.[0] || img;
};

export const getCardTitle = (recipe: Recipe): string => {
    return recipe.title.trim() || `Recept #${recipe.Id.slice(0, 8)}`;
};

export const getCardTags = (recipe: Recipe): string[] => {
    return recipe.tag || [];
};

export const useRecipeBrowser = () => {
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
        if (loading && !isInitial) return;

        setLoading(true);
        console.log("fetched");

        try {
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
                setHasMore(!!data.nextPK && data.recipes.length === limit); 
            } else {
                setHasMore(false);
                if (isInitial) {
                    setRecipes([]);
                }
            }
        } catch (error) {
            console.error("Fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        if (recipes.length === 0 && !loading && hasMore) {
            if (!currentSearchTerm) {
                 fetchPage("", PAGE_SIZE, null, null, true);
            }
        }
    }, [fetchPage, recipes.length, loading, hasMore, currentSearchTerm]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTag = searchTag.trim().toLowerCase();

        if (trimmedTag === currentSearchTerm) return;

        setRecipes([]);
        setNextPK(null);
        setNextSK(null);
        setHasMore(true);

        setCurrentSearchTerm(trimmedTag);
        
        fetchPage(trimmedTag, PAGE_SIZE, null, null, true);
    };

    const handleLoadMore = () => {
        if (!hasMore || loading || !nextPK || !nextSK) return;

        fetchPage(currentSearchTerm, PAGE_SIZE, nextPK, nextSK, false);
    };
    
    const handleRecipeRemoval = useCallback((recipeId: string) => {
        setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.Id !== recipeId));
        if (selectedRecipe && selectedRecipe.Id === recipeId) {
            setSelectedRecipe(null);
            setCurrentModalImageUrl('');
        }
    }, [selectedRecipe]);

    const toggleImageDisplay = useCallback(() => {
        setShowImages(prev => !prev);
    }, []);

    const openModal = useCallback((recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setCurrentModalImageUrl(getCardImageUrl(recipe));
    }, []);

    const closeModal = useCallback(() => {
        setSelectedRecipe(null);
        setCurrentModalImageUrl('');
    }, []);

    const handleThumbnailClick = useCallback((imageUrl: string) => {
        setCurrentModalImageUrl(imageUrl);
    }, []);

    return {
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
    };
};