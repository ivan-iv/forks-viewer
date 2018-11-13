import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {formatNumber, range, matchRoute, navTo, isFocused} from './utils';
import './styles.scss';


function Star() {
  return (
    <svg className="icon" viewBox="0 0 14 16" version="1.1" width="14" height="16" role="img">
      <path
        fillRule="evenodd"
        d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z">
      </path>
    </svg>
  );
}


export function Router({routes}) {
  const content = routes.filter(x => x.path != '*');
  for (let config of content) {
    const route = matchRoute(config.path);
    if (route) {
      return React.createElement(config.component, {route});
    }
  }

  const notFound = routes.find(x => x.path == '*');
  if (notFound) {
    return React.createElement(notFound.component);
  }

  return null;
}

Router.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string,
    component: PropTypes.func
  }))
};


function Paginator({total, current, onSelect}) {
  function Item({value, onSelect}) {
    if (value == 'gap') {
      return <span className="paginator-gap">...</span>;
    }
    const cn = classNames('paginator-number', {
      'is-active': value == current
    });
    return <span className={cn} onClick={() => onSelect(value)}>{value}</span>;
  }

  const OFFSET = 2;
  const rawLeft = current - OFFSET;
  const rawRight = current + OFFSET;
  const left = range(rawLeft < 1 ? 1 : rawLeft, current);
  const right = range(current + 1, (rawRight > total ? total : rawRight) + 1);
  const needGapAfterFirst = left.length > 0 && left[0] > 2;
  const needGapBeforeLast = right.length > 0 && (total - right[right.length - 1]) > 1;
  const needFirst = current > OFFSET + 1;
  const needLast = current < total - OFFSET;

  let items = [];
  if (needFirst) {
    items.push(1);
  }
  if (needGapAfterFirst) {
    items.push('gap');
  }
  items = items.concat(left, current, right);
  if (needGapBeforeLast) {
    items.push('gap');
  }
  if (needLast) {
    items.push(total);
  }

  return (
    <div>
      {items.map((x, i) => <Item value={x} key={`${i}-${x}`} onSelect={onSelect} />)}
    </div>
  );
}

Paginator.propTypes = {
  total: PropTypes.number,
  current: PropTypes.number,
  onSelect: PropTypes.func
};


class SearchLine extends React.Component {
  constructor(props) {
    super(props);
    this.onKeydown = this.onKeydown.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeydown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown(ev) {
    if (isFocused(this.inputRef.current) && ev.code == 'Enter') {
      this.onSearch();
    }
  }

  onSearch() {
    const trimmed = this.inputRef.current.value.trim();
    if (trimmed) {
      this.props.onSearch(trimmed);
    }
  }

  render() {
    return (
      <div className="search-line">
        <input
          ref={this.inputRef}
          className="input"
          placeholder="Search fork..."
          defaultValue={this.props.value}
        />
        <button className="btn" onClick={this.onSearch}>
          Search
        </button>
      </div>
    );
  }
}

SearchLine.propTypes = {
  value: PropTypes.string,
  onSearch: PropTypes.func
};


export function Main({onSearch}) {
  return (
    <div>
      <SearchLine onSearch={onSearch} />
      <div className="welcome">
        <svg className="icon" height="40" viewBox="0 0 16 16" version="1.1" width="40"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
        <h2>Simple viewer of GitHub forks</h2>
      </div>
    </div>
  );
}

Main.propTypes = {
  onSearch: PropTypes.func
};


export class SearchResult extends React.Component {
  constructor(props) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
    this.onChangePage = this.onChangePage.bind(this);
  }

  componentDidMount() {
    if (this.props.route.search == null) {
      navTo('/');
    }

    if (this.props.items == null) {
      const params = this.getRouteParams();
      this.props.onSearch(params.repository, params.page);
    }
  }

  getRouteParams() {
    const {repository, page} = this.props.route.search;
    return {
      repository,
      page: Number.parseInt(page)
    };
  }

  onSearch(term) {
    navTo(`/search?page=1&repository=${term}`);
  }

  onChangePage(page) {
    const params = this.getRouteParams();
    navTo(`/search?page=${page}&repository=${params.repository}`);
  }

  renderResult() {
    if (this.props.error) {
      switch (this.props.error.status) {
        case 404:
          return <h3>We couldn’t find any forks</h3>;
        case 403:
          return <h3>For unauthenticated requests, the rate limit allows for up to 60 requests per hour</h3>;
        default:
          return <h3>Unknown error: ${this.props.error.toString()}</h3>;
      }
    }

    return (
      <div className="result">
        <h3>Search results</h3>

        {this.props.items.map(x => (
          <div className="result-item" key={x.name}>
            <div className="result-item__name">{x.name}</div>
            <div className="result-item__owner">{x.owner}</div>
            <div className="result-item__stars">
              <Star />
              <span className="result-item__stars-count">{formatNumber(x.stars)}</span>
            </div>
            <div className="result-item__url"><a href={x.url} target="_blank">{x.url}</a></div>
          </div>
        ))}

        <div className="paginator-container">
          <Paginator
            total={this.props.pages}
            current={this.getRouteParams().page}
            onSelect={this.onChangePage}
          />
        </div>

      </div>
    );
  }

  renderLoader() {
    return <h4>Loading...</h4>;
  }

  render() {
    return (
      <div>
        <SearchLine
          value={this.getRouteParams().repository || ''}
          onSearch={this.onSearch}
        />
        {this.props.pending ? this.renderLoader() : this.renderResult()}
      </div>
    );
  }
}

SearchResult.propTypes = {
  onSearch: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    owner: PropTypes.string,
    stars: PropTypes.number,
    url: PropTypes.string
  })),
  pending: PropTypes.bool,
  pages: PropTypes.number,
  error: PropTypes.object
};


export function NotFound() {
  return <div>Page Not Found :(</div>;
}
