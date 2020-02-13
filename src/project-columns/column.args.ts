import { ArgsType, Field, ID, Int } from "type-graphql";

@ArgsType()
export class CreateColumnArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => String)
    name: string;
}

@ArgsType()
export class DeleteColumnArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    column_id: string;
}

@ArgsType()
export class UpdateColumnArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    column_id: string;

    @Field(type => String)
    name: string
}

@ArgsType()
export class ChangeColumnPositionArgs {
    @Field(type => ID)
    project_id: string;

    @Field(type => ID)
    column_id: string;

    @Field(type => Int)
    position: number;
}