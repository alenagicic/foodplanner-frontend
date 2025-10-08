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
    return recipe.title.trim() || `Recept #${recipe.id.slice(0, 8)}`;
};

export const getCardTags = (recipe: Recipe): string[] => {
    return recipe.tag || [];
};

/**
 * Custom hook for managing state and logic for the recipe browsing page.
 */
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

    // Dependency array is cleaned up. We only need the state setters and PAGE_SIZE
    const fetchPage = useCallback(async (
        tag: string,
        limit: number,
        lastPK: string | null,
        lastSK: string | null,
        isInitial: boolean
    ) => {
        // Prevent loading multiple pages simultaneously
        if (loading && !isInitial) return;
        // The hasMore check for subsequent pages is done in handleLoadMore, not here.

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
                // Determines if there are potentially more pages to load
                setHasMore(!!data.nextPK && data.recipes.length === limit); 
            } else {
                setHasMore(false);
                if (isInitial) {
                    setRecipes([]);
                }
            }
        } catch (error) {
            console.error("Fetch failed:", error);
            // Handle error state gracefully
        } finally {
            setLoading(false);
        }
    }, [loading]); // Only include 'loading' as a dependency to prevent simultaneous calls

    // *** REMOVED THE PROBLEM-CAUSING useEffect HERE ***
    // The initial fetch logic is now triggered directly by handleSearch.
    
    // We add a single useEffect to perform the *very first* load on mount if the search term is empty (e.g., initial state)
    useEffect(() => {
        if (recipes.length === 0 && !loading && hasMore) {
            // Only runs once on mount, or after a full reset if no search term is present
            if (!currentSearchTerm) {
                 fetchPage("", PAGE_SIZE, null, null, true);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means this runs only ONCE after mount.

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTag = searchTag.trim().toLowerCase();

        if (trimmedTag === currentSearchTerm) return; // Prevent re-search if already loaded

        // 1. Reset state
        setRecipes([]);
        setNextPK(null);
        setNextSK(null);
        setHasMore(true);

        // 2. Update search term state
        setCurrentSearchTerm(trimmedTag);
        
        // 3. Trigger the initial fetch directly
        fetchPage(trimmedTag, PAGE_SIZE, null, null, true);
    };

    const handleLoadMore = () => {
        // Essential checks moved here for safety
        if (!hasMore || loading || !nextPK || !nextSK) return;

        fetchPage(currentSearchTerm, PAGE_SIZE, nextPK, nextSK, false);
    };

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
    };
};