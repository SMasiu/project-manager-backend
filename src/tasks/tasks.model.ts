import { ObjectType, Field, ID, Int } from "type-graphql";
import { DateScalar } from "src/graphql/scalars/date.scalar";
import { User } from "src/user/user.model";
import { Column } from "src/project-columns/column.model";

@ObjectType()
export class Task {
    @Field(type => ID)
    task_id: string;

    @Field(type => String)
    name: string;

    @Field(type => String)
    description: string;

    @Field(type => DateScalar)
    create_stamp: Date;

    @Field(type => Int)
    priority: number;

    @Field(type => User)
    creator: User;

    @Field(type => Column)
    column: Column;

    @Field(type => [User])
    assignedUsers: User[];
}