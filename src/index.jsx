import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {Router, Main, SearchResult, NotFound} from './views';
import {navTo} from './utils';
import {Actions, Selectors, store} from './state';


const MainContainer = connect(
  (state, {route}) => ({route}),
  (dispatch) => ({
    onSearch(term) {
      navTo(`/search?page=1&repository=${term}`);
    }
  })
)(Main);

const SearchResultContainer = connect(
  (state, {route}) => ({
    route,
    items: Selectors.getForks(state),
    pages: Selectors.getPages(state),
    pending: Selectors.getPending(state),
    error: Selectors.getError(state)
  }),
  (dispatch) => ({
    onSearch(term, page) {
      dispatch(Actions.searchForks(term, page));
    }
  })
)(SearchResult);


const routes = [
  {path: '/', component: MainContainer},
  {path: '/search', component: SearchResultContainer},
  {path: '*', component: NotFound}
];


ReactDOM.render(
  <Provider store={store}>
    <Router routes={routes}/>
  </Provider>,
  document.getElementById('app')
);
