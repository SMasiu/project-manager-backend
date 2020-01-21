import { Resolver, Mutation, Context, Args, Query } from "@nestjs/graphql";
import { Team, TeamMember } from "./team.model";
import { TeamService } from "./team.service";
import { NewTeamArgs, AddMemberArgs, GetTeamArgs, TeamIdArgs, KickArgs } from "./team.args";
import { take } from "rxjs/operators";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { Subject } from "rxjs";
import { MemberType } from "./team.type";

@Resolver()
export class TeamResolver {

    constructor(private readonly teamService: TeamService) { }

    @Mutation(type => Team)
    @UseGuards(AuthGuard)
    async CreateTeam(@Args() team: NewTeamArgs, @Context() ctx) {
        try {
            return await this.teamService.createTeam(team, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => TeamMember)
    @UseGuards(AuthGuard)
    async AddTeamMember(@Args() args: AddMemberArgs, @Context() ctx) {
        try {
            return await this.teamService.addMember(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => TeamMember)
    @UseGuards(AuthGuard)
    async AcceptTeamInvitation(@Args() args: TeamIdArgs, @Context() ctx) {
        try {
            return await this.teamService.acceptTeamInvitation(args.team_id, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => TeamMember)
    @UseGuards(AuthGuard)
    async LeaveTeam(@Args() args: TeamIdArgs, @Context() ctx) {
        try {
            return await this.teamService.leaveTeam(args.team_id, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [TeamMember])
    @UseGuards(AuthGuard)
    async TeamMembers(@Args() args: GetTeamArgs, @Context() ctx) {
        try {
            return await this.teamService.getTeam(args.id, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [Team])
    @UseGuards(AuthGuard)
    async Teams(@Context() ctx) {
        try {
            return await this.teamService.getTeams(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }
    
    @Mutation(type => Team)
    @UseGuards(AuthGuard)
    async DeleteTeam(@Args() args: TeamIdArgs, @Context() ctx) {
        try {
            return await this.teamService.deleteTeam(args.team_id, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => TeamMember)
    @UseGuards(AuthGuard)
    async KickOutOfTheTeam(@Args() args: KickArgs, @Context() ctx) {

        try {
            return await this.teamService.kickOutOfTheTeam(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }

    }

}