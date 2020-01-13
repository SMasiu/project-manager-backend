import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class GetOptionsArgs {
    @Field(type => String, {nullable: true})
    limit: number;

    @Field(type => String, {nullable: true})
    offset: number;
}