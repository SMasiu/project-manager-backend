export const mapTeams = (rows: any[]) => rows.map( r => ({
    team_id: r.team_id,
    name: r.name,
    owner: {
        user_id: r.owner_id,
        name: r.owner_name,
        surname: r.owner_surname,
        nick: r.owner_nick
    },
    membersCount: r.members_count
}));
