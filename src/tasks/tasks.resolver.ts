import { Resolver, Mutation, Args, Context, ResolveProperty, Parent } from "@nestjs/graphql";
import { Task } from "./tasks.model";
import { TasksService } from "./tasks.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";
import { CreateTaskArgs, UpdateTaskArgs, DeleteTaskArgs, MoveTaskArgs } from "./tasks.args";
import { take } from "rxjs/operators";
import { User } from "src/user/user.model";
import { UserService } from "src/user/user.service";
import { Column } from "src/project-columns/column.model";
import { ColumnService } from "src/project-columns/column.service";
import { ColumnGuard } from "src/shared/guards/column.guard";
import { TaskGuard } from "src/shared/guards/task.guard";

@Resolver(type => Task)
export class TaskResolver {

    constructor(
        private readonly taskService: TasksService,
        private readonly userService: UserService,
        private readonly columnService: ColumnService) { }

    @Mutation(type => Task)
    @UseGuards(AuthGuard, ProjectGuard, ColumnGuard)
    async CreateTask(@Args() args: CreateTaskArgs, @Context() ctx) {
        try {
            return await this.taskService.createTask(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Task)
    @UseGuards(AuthGuard, ProjectGuard, TaskGuard)
    async UpdateTask(@Args() args: UpdateTaskArgs) {
        try {
            return await this.taskService.updateTask(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Task)
    @UseGuards(AuthGuard, ProjectGuard, TaskGuard)
    async DeleteTask(@Args() args: DeleteTaskArgs) {
        try {
            return await this.taskService.deleteTask(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Task)
    @UseGuards(AuthGuard, ProjectGuard, ColumnGuard, TaskGuard)
    async MoveTask(@Args() args: MoveTaskArgs) {
        try {
            return await this.taskService.moveTask(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('creator', type => User)
    async GetCreator(@Parent() parent) {
        try {
            return await this.userService.getUser(parent.creator).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @ResolveProperty('column', type => Column)
    async GetColumn(@Parent() parent) {
        try {
            return await this.columnService.getColumnById(parent.column).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}