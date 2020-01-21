import { Field, ArgsType, ID, Int } from "type-graphql";

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

@ArgsType()
export class KickArgs extends TeamIdArgs {
    @Field(type => ID)
    user_id: string;
}

@ArgsType()
export class PermissionArgs extends TeamIdArgs{
    @Field(type => ID)
    user_id: string;

    @Field(type => Int)
    permission: number;
}

@ArgsType()
export class ChangeOwnerArgs extends TeamIdArgs {
    @Field(type => ID)
    user_id: string;
}