import { Resolver, Mutation, Args, ResolveProperty, Parent } from "@nestjs/graphql";
import { Column } from "./column.model";
import { ColumnService } from "./column.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";
import { ProjectModeratorGuard } from "src/shared/guards/project-permission.guard";
import { CreateColumnArgs } from "./column.args";
import { take } from "rxjs/operators";
import { Project } from "src/projects/projects.model";
import { ProjectsService } from "src/projects/projects.service";

@Resolver(type => Column)
export class ColumnResolver {
    
    constructor(private columnService: ColumnService, private projectService: ProjectsService) { }

    @Mutation(type => Column)
    @UseGuards(AuthGuard, ProjectGuard, ProjectModeratorGuard)
    async CreateColumn(@Args() args: CreateColumnArgs) {
        try {
            return await this.columnService.createColumn(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('project', type => Project)
    async GetProject(@Parent() parent) {    
        return await this.projectService.getProjectById(parent.project).pipe(take(1)).toPromise();
    }

}