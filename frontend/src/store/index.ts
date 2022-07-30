/* eslint-disable import/no-cycle */
import { createStore } from "vuex";

import modalVisibility from "./modules/modalVisibility";

const emptyModule = {
	namespaced: true
};

export default createStore({
	modules: {
		modalVisibility,
		modals: {
			namespaced: true,
			modules: {
				whatIsNew: emptyModule,
				viewYoutubeVideo: emptyModule
			}
		}
	},
	strict: false
});
