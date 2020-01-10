export interface UserType {
    id: string;
    name: string;
    surname: string;
    nick: string;
}


export interface MeType extends UserType {
    email: string;
}

export interface NewUserType extends Omit<MeType, 'id'> {
    confirmPassword: string;
    password: string;
}

export interface NewFullUserType extends NewUserType {
    id: string;
}