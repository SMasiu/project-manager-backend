import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class User {
    @Field(type => ID)
    user_id: string;

    @Field()
    name: string;

    @Field()
    surname: string;

    @Field()
    nick: string;
}

@ObjectType()
export class Me extends User {
    
    @Field()
    email: string;
}

@ObjectType()
export class MeStatus {
    @Field()
    logged: boolean;

    @Field(type => Me, {nullable: true})
    me: Me;
}

@ObjectType()
export class UsersAndCount {
    @Field(type => [User])
    users: User[];

    @Field(type => Int)
    count: number;
}