import { get } from 'lodash';
import { createSelector } from 'reselect';

const account = state => state.web3.account;
export const accountSelector = createSelector(account, acc => acc);

const web3 = state => state.web3.connection;
export const web3selector = createSelector(web3, web => web);
