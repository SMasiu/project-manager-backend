import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class UserTaskArgs {
    @Field(type => ID)
    task_id: string;

    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    user_id: string;
}