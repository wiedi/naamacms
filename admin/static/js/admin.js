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

var x;
function fileViewModel(o) {
	var self = this
	
	this.apiRoot = o.apiRoot
	
	this.dir = ko.observable('/')
	this.list = ko.observableArray([])
	this.loading = ko.observable(true)
	
	this.editor = new EpicEditor({
		basePath: '/static/js/lib/EpicEditor/epiceditor',
	})
	this.showList = function() {
		console.log(x = $('#fileupload').fileupload({
			url: self.apiRoot + self.dir() + '/bla.data',
			add: function(e, data) {
				 console.log('ADDDDD', e, data)
				 window.fileuploadRequest = data.submit();
			 },
			fail: function(e) { console.log('FAIL', e)},
			done: function(e, data) { console.log('DONE', e, data)}
		})[0])
	}
	this.hideList = function() {
		
	}
	this.refresh = function() {
		self.dir(normalizePath('/' + self.dir()))
		self.loading(true)
		$.getJSON(self.apiRoot + self.dir(), function(data) {
			self.list(data)
			self.loading(false)
		})
	}
	this.showEditor = function() {
		self.editor.load()
		$('button').tooltip({delay: { show: 700, hide: 100}, container: 'body' })
		$.get(self.apiRoot + self.dir(), function(data) {
			self.editor.importFile(self.dir, data)
			self.loading(false)
		}).error(function() {
			self.editor.importFile(self.dir, '# New Page')
		})
		
	},
	this.hideEditor = function() {
		self.editor.unload()
	}
	this.load = function() {
		self.dir(normalizePath('/' + self.dir()))
		self.loading(true)
	}
	this.save = function() {
		$.post(self.apiRoot + self.dir(), self.editor.exportFile(), function() {})
		self.up()
	}
	this.up = function() {
		pager.navigate(resolvePath('../list') + '?dir=' + encodeURIComponent(resolvePath('../', self.dir())))
		return true
	}
	this.cancel = this.up
	this.parentDir = function(dir) {
		return normalizePath('/' + dir + '/../')
	}
	this.remove = function() {
		var dir = normalizePath(self.dir() + '/' + this.name)
		bootbox.confirm("Are you sure you want to delete '" + dir + "'?", function(result) {
			if(result) {
				$.ajax({type: 'DELETE', url: self.apiRoot + dir}).done(function() {
					self.refresh()	
				})
			}
		})
	}
	this.newPage = function() {
		bootbox.prompt("Please enter the name for new page:", function(result) {                
			if(result === null) {
				return
			}
			if(result.substr(-3) != '.md') {
				result += '.md'
			}
			pager.navigate('pages/edit?dir=' + encodeURIComponent(resolvePath(result, self.dir())))
		})
	}
	this.newFolder = function() {
		bootbox.prompt("Please enter the new folder name:", function(result) {                
			if(result === null) {
				return
			}
			var dir = resolvePath(result, self.dir())
			$.ajax({type: 'PUT', url: self.apiRoot + dir}).done(function(){
				pager.navigate('pages/list?dir=' + encodeURIComponent(dir))
			})

		})
	}
	this.uploadFile = function() {
		$('#uploadModal').modal('show')
	}
	this.surroundWith = function(prefix, postfix) {
		var selection = self.editor.editorIframeDocument.getSelection()
		var document  = self.editor.editorIframeDocument
		if (selection.rangeCount === 0) return

		// prefix
		var range = selection.getRangeAt(0)
		range.insertNode(document.createTextNode(prefix))
		range.collapse(false)
	
		// postfix
		selection.removeAllRanges()
		selection.addRange(range)
		range.insertNode(document.createTextNode(postfix))
	}
	this.h1 = function() { self.surroundWith('# ', '') }
	this.h2 = function() { self.surroundWith('## ', '') }
	this.h3 = function() { self.surroundWith('### ', '') }
	this.ul = function() { self.surroundWith('* ', '') }
	this.ol = function() { self.surroundWith('1. ', '') }
	this.bold   = function() { self.surroundWith('**', '**') }
	this.italic = function() { self.surroundWith('_', '_') }
	this.link = function() {
		 
	}
	this.image = function() {
		
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
		apiRoot: '/api/pages/',
		
	}),
	dates: new crudViewModel({
		apiRoot: '/api/metadata/dates.json',
		fields: {
			date: '',
			description: ''
		}
	}),
	publish: function() {
		$.ajax({url: '/api/publish/'}).done(function(data){
			if(data.status == 'success') {
				bootbox.alert("Published")
			} else {
				bootbox.alert("Error")
			}
		})
	}
}

//pager.useHTML5history = true
//pager.Href5.history = History
pager.extendWithPage(viewModel)
ko.applyBindings(viewModel)
pager.start()