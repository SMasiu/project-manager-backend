import { Resolver, Mutation, Args, Context, ResolveProperty, Parent } from "@nestjs/graphql";
import { ProjectsService } from "./projects.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { CreateProjectArgs, ToogleOpenProjectArgs } from "./projects.args";
import { Project } from "./projects.model";
import { Team } from "src/teams/team.model";
import { TeamService } from "src/teams/team.service";
import { take } from "rxjs/operators";
import { TeamGuard } from "src/shared/guards/team.guard";
import { TeamModeratorGuard } from "src/shared/guards/team-permission.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";

@Resolver(type => Project)
export class ProjectsResolver {
    
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly teamService: TeamService
    ) { }
        
    @Mutation(type => Project)
    @UseGuards(AuthGuard, TeamGuard, TeamModeratorGuard)
    async CreateProject(@Args() args: CreateProjectArgs, @Context() ctx) {
        try {
            return await this.projectsService.createProject(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Project)
    @UseGuards(AuthGuard, ProjectGuard)
    async ToogleOpenProject(@Args() args: ToogleOpenProjectArgs) {
        try {
            return await this.projectsService.toogleOpenProject(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('team', type => Team, {nullable: true})
    async GetTeam(@Parent() project) {

        const {team} = project;

        if(team) {
            return await this.teamService.getTeamById(team).pipe(take(1)).toPromise();
        } else {
            return null;
        }

    }

}