import { Resolver, Mutation, Args, ResolveProperty, Parent } from "@nestjs/graphql";
import { Column } from "./column.model";
import { ColumnService } from "./column.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";
import { ProjectModeratorGuard } from "src/shared/guards/project-permission.guard";
import { CreateColumnArgs, DeleteColumnArgs, UpdateColumnArgs, ChangeColumnPositionArgs } from "./column.args";
import { take } from "rxjs/operators";
import { Project } from "src/projects/projects.model";
import { ProjectsService } from "src/projects/projects.service";
import { Task } from "src/tasks/tasks.model";
import { TasksService } from "src/tasks/tasks.service";

@Resolver(type => Column)
export class ColumnResolver {
    
    constructor(
        private readonly columnService: ColumnService,
        private readonly projectService: ProjectsService,
        private readonly tasksService: TasksService) { }

    @Mutation(type => Column)
    @UseGuards(AuthGuard, ProjectGuard, ProjectModeratorGuard)
    async CreateColumn(@Args() args: CreateColumnArgs) {
        try {
            return await this.columnService.createColumn(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Column)
    @UseGuards(AuthGuard, ProjectGuard, ProjectModeratorGuard)
    async DeleteColumn(@Args() args: DeleteColumnArgs) {
        try {
            return await this.columnService.deleteColumn(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Column)
    @UseGuards(AuthGuard, ProjectGuard, ProjectModeratorGuard)
    async UpdateColumn(@Args() args: UpdateColumnArgs) {
        try {
            return await this.columnService.updateColumn(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => [Column])
    @UseGuards(AuthGuard, ProjectGuard, ProjectModeratorGuard)
    async ChangeColumnPosition(@Args() args: ChangeColumnPositionArgs) {
        try {
            return await this.columnService.changeColumnPosition(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('tasks', type => [Task])
    async GetTasks(@Parent() parent) {
        try {
            return await this.tasksService.getAllTasksById(parent.column_id).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('project', type => Project)
    async GetProject(@Parent() parent) {    
        try {
            return await this.projectService.getProjectById(parent.project).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}