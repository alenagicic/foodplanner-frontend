const apiUrl = "https://d254xvzh94.execute-api.eu-north-1.amazonaws.com/Prod";
const API_KEY = "HMyBowoOLe2pEG5CWZAoa5ExQcgD7fds3GvzxuYl"; 

export interface Recipe {
    id: string;
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
            url += `&tag=${tag}`;
        }
        
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
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type, 
            },
            body: file,
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to upload to S3:', error);
        return false;
    }
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