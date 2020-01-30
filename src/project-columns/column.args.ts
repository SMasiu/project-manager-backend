import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class CreateColumnArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => String)
    name: string;
}