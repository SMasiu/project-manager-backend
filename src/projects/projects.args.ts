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