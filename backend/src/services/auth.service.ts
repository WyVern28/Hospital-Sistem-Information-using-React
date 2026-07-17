export async function login(data: any){
    return {
        success: true,
        message: "Login successful",
        user: data,
    };
}

export async function register(data: any){
    return{
        success: true,
        message: "register successful",
        user: data,
    }
}