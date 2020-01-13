export interface TeamType {
    team_id: number;
    name: string;
    owner: string;
}

export interface NewTeamType extends Omit<TeamType, 'team_id' | 'owner'> { }

export interface MemberType {
    permission: number;
    teamId: string;
    userId: string;
}

export interface AddMemberType extends Omit<MemberType, 'permission'> { }