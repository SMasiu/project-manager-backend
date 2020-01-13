import { Resolver, Mutation, Context, Args, Query } from "@nestjs/graphql";
import { Team, TeamMember } from "./team.model";
import { TeamService } from "./team.service";
import { NewTeamArgs, AddMemberArgs, GetTeamArgs } from "./team.args";
import { take } from "rxjs/operators";

@Resolver()
export class TeamResolver {

    constructor(private readonly teamService: TeamService) { }

    @Mutation(type => Team)
    async CreateTeam(@Args() team: NewTeamArgs, @Context() ctx) {
        try {
            return await this.teamService.createTeam(team, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => TeamMember)
    async AddTeamMember(@Args() args: AddMemberArgs, @Context() ctx) {
        try {
            return await this.teamService.addMember(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [TeamMember])
    async TeamMembers(@Args() args: GetTeamArgs, @Context() ctx) {
        try {
            return await this.teamService.getTeam(args.id, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [Team])
    async Teams(@Context() ctx) {
        try {
            return await this.teamService.getTeams(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}