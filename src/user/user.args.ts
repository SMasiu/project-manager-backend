import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class NewUserArgs {
    @Field(type => String)
    email: string;

    @Field(type => String)
    name: string;

    @Field(type => String)
    surname: string;

    @Field(type => String)
    password: string;

    @Field(type => String)
    confirmPassword: string;

    @Field(type => String)
    nick: string;
}