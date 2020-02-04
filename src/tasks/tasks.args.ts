import { ArgsType, Field, ID, Int } from "type-graphql";

@ArgsType()
export class CreateTaskArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    column_id: string;

    @Field(type => String)
    name: string;

    @Field(type => String)
    description: string;

    @Field(type => Int, { nullable: true })
    priority: number;
}

@ArgsType()
export class UpdateTaskArgs {
    @Field(type => ID)
    task_id: string;

    @Field(type => ID)
    project_id: string;

    @Field(type => String)
    name: string;

    @Field(type => String)
    description: string;

    @Field(type => Int, { nullable: true })
    priority: number;
}

@ArgsType()
export class DeleteTaskArgs {
    @Field(type => ID)
    task_id: string;

    @Field(type => ID)
    project_id: string;
}

@ArgsType()
export class MoveTaskArgs {
    @Field(type => ID)
    task_id: string;

    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    column_id: string;
}