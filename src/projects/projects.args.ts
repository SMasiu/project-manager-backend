import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class CreateProjectArgs {
    @Field(type => String)
    name: string;

    @Field(type => String)
    description: string;

    @Field(type => String)
    owner_type: string;

    @Field(type => ID, {nullable: true, defaultValue: null})
    team_id: string;
}

@ArgsType()
export class ToogleOpenProjectArgs {
    @Field(type => Boolean)
    open: boolean;

    @Field(type => ID)
    project_id: string;
}

@ArgsType()
export class ChangeOwnerTypeArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => String)
    owner_type: string;

    @Field(type => ID, {nullable: true})
    team_id: string;
}

@ArgsType()
export class DeleteProjectArgs {
    @Field(type => ID)
    project_id: string;
}