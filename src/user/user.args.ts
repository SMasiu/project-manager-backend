import { ArgsType, Field, ID } from "type-graphql";
import { GetOptionsArgs } from "src/graphql/get-options.args";

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

@ArgsType()
export class LoginUserArgs {
    @Field(type => String)
    userName: string;

    @Field(type => String)
    password: string;
}

@ArgsType()
export class UserArgs {
    @Field(type => ID)
    id: string;
}

@ArgsType()
export class CountUserArgs {
    @Field(type => String, { nullable: true, defaultValue: '' })
    fullname: string;
}

@ArgsType()
export class GetUserArgs extends GetOptionsArgs {
    @Field(type => String, { nullable: true, defaultValue: '' })
    fullname: string;
}