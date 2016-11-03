/*
 * Copyright 2016 Crown Copyright
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package glib.app.aas.ace.client;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.dom.client.Element;
import com.google.gwt.user.client.ui.RequiresResize;
import com.google.gwt.user.client.ui.Widget;

public class VisPanel extends Widget implements RequiresResize {
	private final JavaScriptObject vis;
	private boolean autoResize = true;

	public VisPanel(final String type) {
		vis = create(type);
		setElement(getElement(vis));
	}

	public void setData(final JavaScriptObject context, final JavaScriptObject settings, final JavaScriptObject data) {
		setData(vis, context, settings, data);
	}

	public void resize() {
		resize(vis);
	}

	@Override
	public void onResize() {
		if (autoResize) {
			resize(vis);
		}
	}

	public void setAutoResize(final boolean autoResize) {
		this.autoResize = autoResize;
	}

	private final native JavaScriptObject create(final String type)
	/*-{
    var vis = eval("new " + type + "()");
    return vis;
	}-*/;

	private final native Element getElement(final JavaScriptObject vis)
	/*-{
    return vis.element;
	}-*/;

	private final native void setData(final JavaScriptObject vis, final JavaScriptObject context,
			final JavaScriptObject settings, final JavaScriptObject data)
	/*-{
    vis.setData(context, settings, data);
	}-*/;

	private final native void resize(final JavaScriptObject vis)
	/*-{
    vis.resize();
	}-*/;
}
