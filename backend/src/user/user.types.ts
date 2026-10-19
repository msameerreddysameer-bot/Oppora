


export interface IUser {

    avatar:string,
    FullName:string;
    email:string;
    password:string;
    role:'user' | 'admin';
    college:string;
    branch:string;
    year:string;
    refreshToken:string;
    skills:string[];
    interests:string[];
    isEmailVerified:boolean;
    createdAt:Date;
    updatedAt:Date;
    generateAccessToken():string;
    generateRefreshToken():string;
    isPasswordCorrect(password:string):Promise<boolean>;
}

