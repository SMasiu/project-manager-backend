import { ObjectType, Field, ID, Int } from "type-graphql";
import { Project } from "src/projects/projects.model";
import { Task } from "src/tasks/tasks.model";

@ObjectType()
export class Column {
    @Field(type => ID)
    column_id: string;

    @Field(type => String)
    name: string;

    @Field(type => Int)
    position: number;

    @Field(type => Project)
    project: Project;

    @Field(type => [Task])
    tasks: Task[];
}