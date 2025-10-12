const apiUrl =  import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY; 

export interface Recipe {
    Id: string;
    title: string;
    bodyrecipe: string;
    tag?: string[]; 
    imageUrls: string[];
    created: string;
};

export interface Account {
    username: string,
    Password: string
}

export interface PaginatedRecipes {
    recipes: Recipe[]; 
    
    nextPK: string;
    nextSK: string;
}

const ApiHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
};

function getToken(): string | undefined {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("token") || undefined;
    }
    return undefined;
}

const mergeHeaders = (additionalHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = {
        ...ApiHeaders,
        ...additionalHeaders,
    };
    
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

/* RECIPE */

export async function fetchRecipesPaginated(
    tag: string,
    limit: number = 10,
    lastPK: string = "",
    lastSK: string = "" 
): Promise<PaginatedRecipes | undefined> {
    
    if (!tag) {
        console.error("Tag is required for paginated recipe fetching.");
        return undefined;
    }
    
    try {
        let url = `${apiUrl}/recipe?tag=${tag}&limit=${limit}`;

        if (lastPK) {
            url += `&lastPK=${lastPK}`;
        }
        if (lastSK) {
            url += `&lastSK=${lastSK}`;
        }
        
        const response = await fetch(url, {
            headers: mergeHeaders(), 
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch recipes: ${response.status}`);
        }

        const data: PaginatedRecipes = await response.json(); 
        
        return data;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function fetchRecipesListPaginated(
    tag: string | null = null,
    limit: number = 10,
    lastPK: string = "",
    lastSK: string = "" 
): Promise<PaginatedRecipes | undefined> {
    
    const fetchAll = tag === null || tag === ""; 

    if (!fetchAll && !tag) {
        console.error("Either a tag must be provided, or tag must be explicitly null/empty to fetch all.");
        return undefined;
    }
    
    try {
        let url = `${apiUrl}/recipe?limit=${limit}`;

        if (fetchAll) {
            url += `&all=true`;
        } else {
            url += `&tag=${encodeURIComponent(tag)}`; 
        }
        
        if (lastPK) {
            url += `&lastPK=${encodeURIComponent(lastPK)}`;
        }
        
        if (lastSK) {
            url += `&lastSK=${encodeURIComponent(lastSK)}`;
        }
        
        const response = await fetch(url, {
            headers: mergeHeaders(), 
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch recipes: ${response.status} ${response.statusText}`);
        }

        const data: PaginatedRecipes = await response.json(); 
        
        return data;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
    try {
        const response = await fetch(`${apiUrl}/recipe/${id}`, {
            headers: mergeHeaders(), 
        });
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Recipe with ID ${id} not found.`);
                return undefined;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Recipe = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch recipe by ID:', error);
    }
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe | undefined> {

    try {
        const response = await fetch(`${apiUrl}/recipe`, {
            method: 'POST',
            headers: mergeHeaders(),
            body: JSON.stringify(recipe),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Recipe = await response.json();

        return data;
    } catch (error) {
        console.error('Failed to create recipe:', error);
    }
}

export async function updateRecipe(id: string, recipe: Recipe): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/recipe/${id}`, {
            method: 'PUT',
            headers: mergeHeaders(), 
            body: JSON.stringify(recipe),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to update recipe:', error);
        return false;
    }
}

export async function deleteRecipe(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/recipe/${id}`, {
            method: 'DELETE',
            headers: mergeHeaders(), 
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to delete recipe:', error);
        return false;
    }
}

/* ACCOUNT */

export async function createAccount(account: Omit<Account, 'id'>): Promise<string | undefined> {
    try {
        const response = await fetch(`${apiUrl}/auth/signup`, {
            method: 'POST',
            headers: ApiHeaders,
            body: JSON.stringify(account),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}. Body: ${errorText}`);
            throw new Error(`Account creation failed. Status: ${response.status}`);
        }
        
        const token: string = await response.json(); 
                
        if (!token || token.length < 50) { 
             console.error('Response was not a valid-looking token.');
             return undefined;
        }

        return token;
        
    } catch (error) {
        console.error('Failed to create account:', error);
        return undefined;
    }
}

export async function SigninAccount(account: Omit<Account, 'id'>): Promise<string | undefined> {

    try {
        const response = await fetch(`${apiUrl}/auth/signin`, {
            method: 'POST',
            headers: ApiHeaders,
            body: JSON.stringify(account),
        });
        
        if (!response.ok) {
            const errorText = await response.json();
            console.error(`HTTP error! Status: ${response.status}. Body: ${errorText}`);
            throw new Error(`Sign-in failed. Status: ${response.status}`);
        }
        
        const token: string = await response.json();
        
        if (!token || token.length < 50) { 
             console.error('Response was not a valid-looking token.');
             return undefined;
        }

        return token;
        
    } catch (error) {
        console.error('Failed to sign in:', error);
        return undefined;
    }
}

export async function updateAccount(id: string, account: Account): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/account/${id}`, {
            method: 'PUT',
            headers: mergeHeaders(), 
            body: JSON.stringify(account),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Failed to update account:', error);
        return false;
    }
}

export async function deleteAccount(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/account/${id}`, {
            method: 'DELETE',
            headers: mergeHeaders(), 
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Failed to delete account:', error);
        return false;
    }
}

/* PRESIGNED */

export async function getPresignedUploadUrl(
    fileName: string,
    contentType: string = "image/jpeg"
): Promise<{ uploadUrl: string; key: string; bucket: string } | undefined> {
    try {
        const response = await fetch(
            `${apiUrl}/presigned?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`,
            { headers: mergeHeaders() } 
        );

        if (!response.ok) {
            throw new Error(`Failed to get presigned URL: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function uploadFileToS3(uploadUrl: string, file: File): Promise<boolean> {
    try {
        let fileToUpload = file;
        
        if (file.type.startsWith('image/')) {
            fileToUpload = await compressImage(file, 0.75); 
        }

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': fileToUpload.type, 
            },
            body: fileToUpload,
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to upload to S3:', error);
        return false;
    }
}

function compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1200; 

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Kunde inte hämta canvas-kontext."));
                
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type === "image/png" ? "image/png" : "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error("Bildkomprimering misslyckades."));
                    }
                }, 
                file.type === "image/png" ? "image/png" : "image/jpeg",
                quality);
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* BEAUTIFY */

export async function Beautify(data: string): Promise<string> {

    try {
        const response = await fetch(`${apiUrl}/beautify`, {
            method: 'POST',
            headers: mergeHeaders(),
            body: data,
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}. Body: ${errorText}`);
            throw new Error(`Sign-in failed. Status: ${response.status}`);
        }
        
        const body: string = await response.json();
        
        if (!body || body.length < 50) { 
             console.error('Response was not a valid-looking token.');
             return "";
        }

        return body;
        
    } catch (error) {
        console.error('Failed to sign in:', error);
        return "";
    }

}

/* SUGGESTION */
export async function TagSuggestions(tagPrefix: string, signal?: AbortSignal): Promise<string[]> {
    
    if (!tagPrefix || tagPrefix.trim() === "") {
        return [];
    }

    const decodedPrefix = encodeURIComponent(tagPrefix);
    
    const fullUrl = `${apiUrl}/tag/suggestions?prefix=${decodedPrefix}`;

    console.log("fetched tag")

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: mergeHeaders(),
            signal: signal, 
        });

        if (!response.ok) {
            if (signal?.aborted) {
                const abortError = new Error("Request aborted");
                abortError.name = 'AbortError';
                throw abortError;
            }
            
            const errorData = await response.json();
            console.log(response)
            console.error('API Error during tag suggestion fetch:', errorData);
            throw new Error(`Failed to fetch suggestions: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        
        const suggestions: string[] = data.suggestions || [];
        return suggestions;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        
        console.error("Error in TagSuggestions network call:", error);
        return []; 
    }
}

/* REMOVE ARTICLE */

export async function removeArticle(id: string): Promise<string | undefined> {
    try {
        console.log(id)
        const response = await fetch(`${apiUrl}/recipe/${id}`, {
            method: 'DELETE',
            headers: mergeHeaders(),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}. Body: ${errorText}`);
            throw new Error(`Account creation failed. Status: ${response.status}`);
        }

        const res = await response.json();

        console.log(res)

        return "ok";
        
    } catch (error) {
        console.error('Failed to create account:', error);
        return undefined;
    }
}