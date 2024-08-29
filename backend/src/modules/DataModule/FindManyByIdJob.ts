import Joi from "joi";
import DataModule from "../DataModule";
import DataModuleJob from "./DataModuleJob";

export default abstract class FindManyByIdJob extends DataModuleJob {
	protected static _isBulk = true;

	protected static _payloadSchema = Joi.object({
		_ids: Joi.array()
			.items(
				Joi.string()
					.pattern(/^[0-9a-fA-F]{24}$/)
					.required()
			)
			.min(1)
			.required()
	});

	protected async _execute() {
		const { _ids } = this._payload;

		return this.getModel().findAll({
			where: { _id: _ids }
		});
	}
}
