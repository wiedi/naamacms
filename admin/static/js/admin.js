"use strict"

/* this also takes relative paths */
function resolvePath(href, current) {
	current = current || window.location.hash
	if(href.substring(0, 1) === '/') {
		return href
	}
	var path = current.split('/')
	while (href.substring(0, 3) === '../') {
		path.pop()
		href = href.slice(3);
	}
	path.push(href)
	return path.join('/')
}


function fileViewModel(o) {
	var self = this
	
	this.apiRoot = o.apiRoot
	
	this.dir = ko.observable('/')
	this.list = ko.observableArray([])
	this.loading = ko.observable(true)
		
	this.refresh = function() {
		self.loading(true)
		$.getJSON(self.apiRoot + self.dir(), function(data) {
			self.list(data)
			self.loading(false)
		})		
	}
	
}

function crudViewModel(o) {
	var self = this
	
	this.apiRoot = o.apiRoot
	
	
	this.list = ko.observableArray([])
	this.loading = ko.observable(true)
	
	this.empty_form = o.fields
	this.form = ko.mapping.fromJS(this.empty_form)
	
	this.refresh = function(fn) {
		fn = (typeof(fn) === 'function') ? fn : function() {}
		
		self.loading(true)
		$.getJSON(self.apiRoot, function(data) {
			self.list(data)
			self.loading(false)
			fn()
		})
	}
	this.save = function() {
		console.log("wtf")
		$.post(self.apiRoot, ko.toJSON(this.list), function() {})
	}
	this.add = function(form) {
		this.list.push(ko.toJS(this.form))
		this.save()
		pager.navigate(resolvePath('../'))
	}
	this.edit = function(form) {
		var id = Number($(form.id).val())
		self.list.replace(self.list()[id], ko.toJS(this.form))
		this.save()
		pager.navigate(resolvePath('../'))
	}
	this.beforeAdd = function() {
		ko.mapping.fromJS(self.empty_form, self.form)
	}
	this.beforeEdit = function(page) {
		var id = Number(page.getCurrentId())
		if(self.list().length > id) {
			ko.mapping.fromJS(self.list()[id], self.form)
			return
		}
		/* id out of range, try a list refresh */
		self.refresh(function() {
			ko.mapping.fromJS(self.list()[id], self.form)	
		})
	}
	this.cancel = function(form) {
		pager.navigate(resolvePath('../'))
		return true
	}
	this.remove = function() {
		self.list.remove(this)
		self.save()
	}
}

var viewModel = {
	pages: new fileViewModel({
		apiRoot: '/api/pages',
		
	}),
	dates: new crudViewModel({
		apiRoot: '/api/json/dates.json',
		fields: {
			date: '',
			description: ''
		}
	}),
}

//pager.useHTML5history = true
//pager.Href5.history = History
pager.extendWithPage(viewModel)
ko.applyBindings(viewModel)
pager.start()