import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Card, Row, Col } from 'react-materialize';
import firebase from 'firebase';
import { browserHistory } from 'react-router';

import Login from './login';
import TrackData from './track_data';
import ManageDatasets from './manage_datasets';
import Header from './header';

class App extends React.Component {
	constructor() {
		super();
		this.state = {
			currentUser: null,
			loggedIn: false,
			dataset:
				{
					name: '',
					expenses: [],
					expenseCategories: {},
					expenseAttributes: ['category', 'vendor', 'amount', 'date'],
					sortingProperty: 'category'
				}
		}

		this.login = this.login.bind(this);
		this.logOut = this.logOut.bind(this);
		this.sortExpenses = this.sortExpenses.bind(this);

	}

	render() {
		return (
			<div>
				<Header onLogout={ () => this.logOut() } />
				{ React.cloneElement(this.props.children, { 
						loggedIn: this.state.loggedIn, 
						currentUser: this.state.currentUser,
						expensesForDisplay: this.state.dataset.expenses,
						expenseCategories: this.state.dataset.expenseCategories,
						expenseAttributes: this.state.dataset.expenseAttributes,
						sortExpenses: (property) => this.sortExpenses(property)
				} ) }
			</div>
		)
	}

	login(userName) {
		this.setState({ loggedIn: true, currentUser: userName });
	}

	logOut() {
		this.setState({ loggedIn: false, currentUser: null });
		browserHistory.push('/login');
	}

	sortExpenses(property) {
		let expensesForDisplay = this.state.dataset.expenses;
		let sortingProperty = this.state.dataset.sortingProperty;

		function compare(a,b) {
			if(property === 'amount') {
				return parseFloat(a[property]) - parseFloat(b[property]);
			} else if(property === 'date') {
				return a[property].replace(/-/g, '') - b[property].replace(/-/g, '');
			} else {
				if (a[property].toLowerCase() < b[property].toLowerCase())
					return -1;
				if (a[property].toLowerCase() > b[property].toLowerCase())
					return 1;
				return 0;
			}
		}

		var updatedExpenses = expensesForDisplay.sort(compare);

		this.setState({ sortingProperty: property,
						expensesForDisplay: updatedExpenses });
		console.log(this.state)
	}

	componentDidMount() {
		firebase.auth().onAuthStateChanged((user) => {
			if(user) {
				this.login(user.displayName);
			} else {
				this.logOut();
			}
		});
		
		let firebaseRef = firebase.database().ref('dataset/expenses');
		firebaseRef.on('child_added', (snapshot, key) => {

			const expense = snapshot.val();
			expense.id = snapshot.key;

			const dataset = this.state.dataset;
			dataset.expenses = [...this.state.dataset.expenses, expense]
			this.setState({ dataset: dataset });
		});

		let firebaseRef2 = firebase.database().ref('dataset/expenseCategories');
		firebaseRef2.on('child_added', (snapshot, key) => {

			const category = snapshot.val();
			const identifier = snapshot.key;
			const dataset = this.state.dataset;
			dataset.expenseCategories[identifier] = category;
			this.setState({ dataset: dataset });
		});
		firebaseRef2.on('child_removed', (snapshot) => {
			const dataset = this.state.dataset;
			const key = snapshot.key;
			delete dataset.expenseCategories[key];
			this.setState({dataset: dataset });
		});
	}
}

export default App;