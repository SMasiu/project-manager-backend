import { Field, ArgsType, ID } from "type-graphql";

@ArgsType()
export class NewTeamArgs {
    @Field()
    name: string;
}

@ArgsType()
export class AddMemberArgs {
    @Field(type => ID)
    teamId: string;

    @Field(type => ID)
    userId: string;
}

@ArgsType()
export class GetTeamArgs {
    @Field(type => ID)
    id: string;
}

@ArgsType()
export class TeamIdArgs {
    @Field(type => ID)
    team_id: string;
}