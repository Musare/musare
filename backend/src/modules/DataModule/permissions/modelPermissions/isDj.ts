import User from "../../models/User";
import Station from "../../models/Station";

export default (model: Station, user?: User) => false;
// TODO
// model && user && model.djs.includes(user._id);