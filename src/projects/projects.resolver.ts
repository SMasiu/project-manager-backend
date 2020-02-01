import { Resolver, Mutation, Args, Context, ResolveProperty, Parent, Query } from "@nestjs/graphql";
import { ProjectsService } from "./projects.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { CreateProjectArgs, ToogleOpenProjectArgs, ChangeOwnerTypeArgs, DeleteProjectArgs, GetProjectArgs } from "./projects.args";
import { Project } from "./projects.model";
import { Team } from "src/teams/team.model";
import { TeamService } from "src/teams/team.service";
import { take } from "rxjs/operators";
import { TeamGuard } from "src/shared/guards/team.guard";
import { TeamModeratorGuard } from "src/shared/guards/team-permission.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";
import { ProjectAdminGuard } from "src/shared/guards/project-permission.guard";
import { Column } from "src/project-columns/column.model";
import { ColumnService } from "src/project-columns/column.service";

@Resolver(type => Project)
export class ProjectsResolver {
    
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly teamService: TeamService,
        private readonly columnService: ColumnService
    ) { }
    
    @Query(type => [Project])
    @UseGuards(AuthGuard)
    async GetProjects(@Context() ctx) {
        try {
            return await this.projectsService.getMyProjects(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => Project)
    @UseGuards(AuthGuard, ProjectGuard)
    async GetProject(@Args() args: GetProjectArgs) {
        try {
            return await this.projectsService.getProjectById(args.project_id).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }
        
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
    @UseGuards(AuthGuard, ProjectGuard, ProjectAdminGuard)
    async ToogleOpenProject(@Args() args: ToogleOpenProjectArgs) {
        try {
            return await this.projectsService.toogleOpenProject(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Project)
    @UseGuards(AuthGuard, ProjectGuard, ProjectAdminGuard, TeamGuard, TeamModeratorGuard)
    async ChangeProjectOwnerType(@Args() args: ChangeOwnerTypeArgs) {
        try {
            return await this.projectsService.changeOwnerType(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Project)
    @UseGuards(AuthGuard, ProjectGuard, ProjectAdminGuard)
    async DeleteProject(@Args() args: DeleteProjectArgs) {
        try {
            return await this.projectsService.deleteProject(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('columns', type => [Column])
    async GetColumns(@Parent() parent) {
        try {
            return await this.columnService.getMappedAllColumns(parent.project_id).pipe(take(1)).toPromise();
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