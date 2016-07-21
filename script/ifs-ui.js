$(jQuery.getJSON('./icon_data.json', function(json){
	window.initIFS(json);
	var template_fontawesome = $('#icon-template-fontawesome').text();
	var IFS = window.IFS;
	var container = $('#icon-container');
	var icon_names = [];
	for(var i=0; i<IFS.icons.length; i++){
		var icon = IFS.icons[i];
		var html = template_fontawesome;
		html = html.split('{%_id_%}').join(icon.id)
		html = html.split('{%_name_%}').join(icon.name);
		html = html.split('{%_title_%}').join(icon.title);
		var block = $(html);
		$(container).append(block);
		icon_names.push(icon.id);
	}

	var input = $('#search_keyword');
	var icon_blocks = $(container).children("div.icon_block");
	var from = new Date();
	var is_now_searching = false;

	var reflect_func = function*(blocks, keys){
		var counter = 0;
		for(var i=0; i<blocks.length; i++){
			var block = blocks[i];
			if(!block){ yield false; }
			var id = $(block).prop("id");
			if(keys.some(function(v,i,a){ return v === id; })){
				$(block).show();
			}else{
				$(block).hide();
			}
			counter = ++counter % 20;
			if(!counter){ yield true; }
		}
		yield false;
	};

	var reflect_wait_id = 0;
	var search_func = function(){
		var keywords = $(input).val();
		var search_result = [];
		if(keywords === ""){
			search_result = icon_names;
		}else{
			search_result = IFS.filterByKeywords(keywords);
		}
		var reflect = reflect_func(icon_blocks, search_result);
		is_now_searching = true;
		reflect_wait_id_id = setInterval(function(){
			if(!reflect.next().value){
				is_now_searching = false;
				clearInterval(reflect_wait_id_id);
			}
		},0);
	};

	var input_wait_id = 0;
	var wait_func = function(){
		var now = new Date();
		var msec_to_wait = 0.3 * 1000;
		var msec_diff = now.getTime() - from.getTime();
		if(!is_now_searching && msec_to_wait <= msec_diff){
			search_func();
		}else{
			if(input_wait_id){ clearTimeout(input_wait_id); }
			input_wait_id = setTimeout(wait_func, 20);
		}
	};

	var last_keywords = '';
	$(input).on('keyup',(function(e){
		var keywords = $(input).val();
		if(last_keywords != keywords){
			last_keywords = keywords;
			from = new Date();
			wait_func();
		}
	}));
	$('input[name="searchmode"]:radio').parent('label').click( function() {
		var radio = $( this ).children('input:radio');
		setTimeout(function(){
			if($(radio).prop('checked')){
				switch($(radio).val()){
					case "AND": IFS.setSearchModeAND(); wait_func(); break;
					case "OR": IFS.setSearchModeOR(); wait_func(); break;
				}
			}
		}, 0);
	});

	var tags = $('div.IFS-TAGS');
	var tag_in_tags = function tag_in_tags(id){
		var selector = 'span[data="{%_id_%}"]'.replace("{%_id_%}", id);
		return $(tags).children("span.IFS-TAG").is(selector);
	};
	var template_tag = $('#tag-template').text();
	var append_tag = function append_tag(id){
		var name = id.split(IFS.SEPARATOR).pop();
		var html = template_tag.split('{%_id_%}').join(id).split('{%_name_%}').join(name);
		$(tags).append($(html));
	};
	$('#icon-container').children('div.IFS-BUTTON').click(function(){
		var id=$(this).prop("id");
		if(!tag_in_tags(id)){ append_tag(id); }
	});

	$(tags).on('click', "span.IFS-TAG > span.label > span.IFS-DELETE", function(){
		var id = $(this).attr('data');
		var selector = '[data="{%_id_%}"]'.replace("{%_id_%}", id);
		$(tags).children("span.IFS-TAG").remove(selector);
	});
	
	$('#get_code').click(function(){
		var taglist = $("span.IFS-TAG", $(tags))
		if($(taglist).length > 0){
			var header_code = $("#header_code"), headers = {};
			var content_code = $("#content_code"), contents = [];
			$(taglist).each(function(){
				var attr = $(this).attr('data').split(IFS.SEPARATOR);
				var provider = IFS.icon_info.filter(function(e){ return e.provider === attr[0]; }).pop();
				if(provider){
					headers[provider.cdn] = true;
					contents.push(provider.code.split("{%_name_%}").join(attr[1]));
				}
			});
			$(header_code).text(Object.keys(headers).join('\n'));
			$(content_code).text(contents.join('\n'));		
			$('#myModal').modal('show');
		}else{
			alert('no icon(s) are selected.');
		}
	});
}));

