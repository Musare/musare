import FindManyByIdJob from "@/modules/DataModule/FindManyByIdJob";

export default class FindManyById extends FindManyByIdJob {
	protected static _modelName = "minifiedUsers";

	protected static _hasPermission = true;

	protected async _authorize() {}
}
