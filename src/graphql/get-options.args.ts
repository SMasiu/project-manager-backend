import { ArgsType, Field, Int } from "type-graphql";

@ArgsType()
export class GetOptionsArgs {
    @Field(type => Int, {nullable: true})
    limit: number;

    @Field(type => Int, {nullable: true})
    offset: number;
}