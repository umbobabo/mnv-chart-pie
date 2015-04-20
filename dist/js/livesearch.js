function ecLiveSearch(config){
  var widget, inputField, resultsList, widgetClassName = "mnv-ec-livesearch", search, trigger, hideResults, bindEvents, container, hideOnLeave, log, list, searchProperty, prefix, timer, hideTimer, close;
  prefix = widgetClassName + "-";
  this.init = function(config){
    if(config.list instanceof Array === false) {
      log("list should be an array");
      return false;
    };
    if(config.list.length === 0) {
      log("list shouldn't be empty");
      return false;
    };
    if(config.searchProperty === undefined) {
      log("Provide a searchProperty");
      return false;
    }
    if(config.searchProperty === undefined) {
      log("Provide a searchProperty");
      return false;
    }
    container = document.querySelectorAll('.' + widgetClassName);
    if(container.length===0){
      log('Unable to find a widget with class ' + widgetClassName);
      return false;
    }
    container = container[0];
    list = config.list;
    searchProperty = config.searchProperty;
    hideOnLeave = config.hideOnLeave || false;
    inputField = document.createElement('input');
    inputField.className = prefix + "input";
    inputField.setAttribute('placeholder', config.placeholder );
    close = document.createElement('button');
    close.innerText = 'X';
    resultsList = document.createElement('ul');
    resultsList.className = prefix + "list";
    resultsList.style.display = 'block';
    container.appendChild(inputField);
    container.appendChild(close);
    container.appendChild(resultsList);
    bindEvents();
  };

  search = function(str){
    var results, items;
    log('Starting search');
    resultsList.style.display = 'block';
    resultsList.innerHTML = '';
    if(str.trim()===""){
      results = [];
    } else {
      results = list.filter(function(value){
        return (value[searchProperty].indexOf(str) >= 0) ? true : false;
      });
    }
    if(results.length===0){
      resultsList.innerHTML = '<li>No results</li>';
    } else {
      items = [];
      results.map(function(obj){
        var item = document.createElement('li');
        item.innerHTML = obj[searchProperty];
        item.addEventListener('click', function(){
          inputField.value = obj[searchProperty];
          trigger.call(container, 'resultSelected', obj);
          hideResults(false);
        });
        resultsList.appendChild(item);
      });
    }
  };

  trigger = function(ev, data){
    if (window.CustomEvent) {
      var event = new CustomEvent(ev, {
        detail: data
      });
    } else {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(ev, true, true, data);
    }
    this.dispatchEvent(event);
  }

  log = function(txt){
    if(window.console && window.console.log){
      console.log(txt);
    }
  };

  hideResults = function(resetInput){
    if(resetInput===true){
      inputField.value = '';
    }
    resultsList.innerHTML = "";
    resultsList.style.display = 'none';
  }

  bindEvents = function(){
    inputField.addEventListener('keyup', function(){
      var str =  this.value.trim();
      clearTimeout(timer);
      timer = window.setTimeout(function() {
        search(str);
      }, 500);
    });
    inputField.addEventListener('focus', function(){
      inputField.value = '';
    });
    if(hideOnLeave){
      resultsList.addEventListener('mouseleave', function(){
        clearTimeout(hideTimer);
        hideTimer = window.setTimeout(function() {
          hideResults();
        }, 1000);
      });
    }
    close.addEventListener('click', function(){
      hideResults(true)
    });
  };

  if(!config){
    log("You have to provide a config object");
    return false;
  }
  this.init(config);
}
