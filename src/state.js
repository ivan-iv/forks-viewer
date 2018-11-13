import agent from 'superagent';
import {createStore, combineReducers, applyMiddleware} from 'redux';
import {connect, Provider} from 'react-redux';


const thunkMiddleware = ({getState, dispatch}) => next => action => {
  if (typeof action == 'function') {
    return action({getState, dispatch});
  }
  return next(action);
};


const API = {
  fetchForks(term, page) {
    // Very fragile but simplest way to extract page count from the "link" header
    function getPageCount(headers) {
      const header = headers['link'];
      if (header) {
        const last = /page=(\d+)&per_page=\d+>; rel="last"/.exec(header);
        if (last) {
          return {pages: Number.parseInt(last[1])};
        }
        // For last page rel="last" doesn't available so check for rel="prev"
        const prev = /page=(\d+)&per_page=\d+>; rel="prev"/.exec(header);
        if (prev) {
          return {pages: Number.parseInt(prev[1]) + 1};
        }
      }
      return null;
    }

    const [owner, repo] = term.split('/');

    return agent.get(`https://api.github.com/repos/${term}/forks?page=${page}&per_page=20`)
      .then(res => ({items: res.body, ...getPageCount(res.headers)}));
  }
};


const Types = {
  SEARCH_FORKS_REQUEST: 'SEARCH_FORKS_REQUEST',
  SEARCH_FORKS_SUCCESS: 'SEARCH_FORKS_SUCCESS',
  SEARCH_FORKS_FAILURE: 'SEARCH_FORKS_FAILURE'
};


const initialState = {
  items: null,
  pending: true,
  pages: 0,
  error: null
};

function appReducer(state = initialState, action) {
  switch (action.type) {
    case Types.SEARCH_FORKS_REQUEST:
      return Object.assign({}, state, {
        pending: true,
        error: null
      });

    case Types.SEARCH_FORKS_SUCCESS:
      return Object.assign({}, state, {
        items: action.payload.items,
        pages: action.payload.pages,
        pending: false
      });

    case Types.SEARCH_FORKS_FAILURE:
      return Object.assign({}, state, {
        error: action.payload,
        pending: false
      });

    default: return state;
  }
}


export const Actions = {
  searchForks(term, page) {
    return ({dispatch}) => {
      dispatch({type: Types.SEARCH_FORKS_REQUEST});

      return API.fetchForks(term, page)
        .then(res => dispatch({
          type: Types.SEARCH_FORKS_SUCCESS,
          payload: res
        }))
        .catch(err => dispatch({
          type: Types.SEARCH_FORKS_FAILURE,
          payload: err
        }));
    };
  }
};


export const Selectors = {
  getForks: state => state.items && state.items.map(x => ({
    name: x.full_name,
    owner: x.owner.login,
    stars: x.stargazers_count,
    url: x.html_url
  })),
  getPages: state => state.pages,
  getPending: state => state.pending,
  getError: state => state.error
};


export const store = createStore(appReducer, applyMiddleware(thunkMiddleware));
