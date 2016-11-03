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

import com.google.gwt.core.client.Callback;
import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.event.dom.client.ChangeEvent;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.uibinder.client.UiHandler;
import com.google.gwt.user.client.Timer;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.ListBox;
import com.google.gwt.user.client.ui.ResizeLayoutPanel;
import com.google.gwt.user.client.ui.Widget;

public class Page extends Composite {
	private static LayoutUiBinder uiBinder = GWT.create(LayoutUiBinder.class);

	interface LayoutUiBinder extends UiBinder<Widget, Page> {
	}

	@UiField
	ListBox type;
	@UiField
	ResizeLayoutPanel visContainer;
	@UiField
	Button resize;
	@UiField
	CheckBox autoResize;
	@UiField
	Button update;
	@UiField
	CheckBox autoUpdate;

	private VisPanel visPanel;
	private String visUrl;

	// private JavaScriptObject context;
	// private JavaScriptObject settings;
	// private JavaScriptObject data;

	public Page() {
		initWidget(uiBinder.createAndBindUi(this));

		type.addItem("Line Chart", "LineChart");
		type.addItem("Bar Chart", "BarChart");
		type.addItem("Doughnut", "Doughnut");
		type.addItem("Hour/Day Heat Map", "HourDayHeatMap");
		type.addItem("Day/Week Heat Map", "DayWeekHeatMap");
		type.addItem("Hour/Day Point Map", "HourDayPointMap");
		type.addItem("Series day Heat Map", "SeriesDayHeatMap");
		type.addItem("Hour Day Session Map", "HourDaySessionMap");
		type.addItem("Series Session Map", "SeriesSessionMap");

		autoUpdate.setValue(true);

		new Timer() {
			@Override
			public void run() {
				if (autoUpdate.getValue()) {
					update();
				}
			}
		}.scheduleRepeating(2000);
	}

	private void update() {
		final String visType = type.getSelectedValue();

		final Callback<Void, Exception> callback = new Callback<Void, Exception>() {
			@Override
			public void onSuccess(final Void result) {
				final JavaScriptObject testData = getTestData(visType, 0);
				final String[] urls = new String[] { "/vis/" + visType + ".js" };
				final String type = visType;
				final String functionName = "visualisations." + visType;
				setData(urls, type, functionName, new JSONObject().getJavaScriptObject(),
						new JSONObject().getJavaScriptObject(), testData);
			}

			@Override
			public void onFailure(final Exception reason) {
				Window.alert(reason.getMessage());
			}
		};
		MultiScriptLoader.loadScripts(callback, "/vis/d3.js", "/vis/TestData.js", "/vis/Common.js");
	}

	public void setData(final String[] urls, final String visUrl, final String functionName,
			final JavaScriptObject context, final JavaScriptObject settings, final JavaScriptObject data) {
		try {
			// this.context = context;
			// this.settings = settings;
			// this.data = data;

			if (this.visUrl == null || !this.visUrl.equals(visUrl)) {
				this.visUrl = visUrl;
				final Callback<Void, Exception> callback = new Callback<Void, Exception>() {
					@Override
					public void onSuccess(final Void result) {
						try {
							if (visPanel != null) {
								visContainer.remove(visPanel);
							}

							visPanel = new VisPanel(functionName);
							visContainer.setWidget(visPanel);

							visPanel.setAutoResize(autoResize.getValue());
							visPanel.setData(context, settings, data);
						} catch (final Exception e) {
							Window.alert(e.getMessage());
						}
					}

					@Override
					public void onFailure(final Exception e) {
						Window.alert(e.getMessage());
					}
				};

				MultiScriptLoader.loadScripts(callback, urls);

			} else {
				visPanel.setData(context, settings, data);
			}
		} catch (final Exception e) {
			Window.alert(e.getMessage());
		}
	}

	@UiHandler("type")
	public void onTypeChange(final ChangeEvent e) {
		update();
	}

	@UiHandler("resize")
	public void onResizeClick(final ClickEvent e) {
		if (visPanel != null) {
			visPanel.resize();
		}
	}

	@UiHandler("autoResize")
	public void onAutoResizeChange(final ValueChangeEvent<Boolean> e) {
		if (visPanel != null) {
			visPanel.setAutoResize(autoResize.getValue());
		}
	}

	@UiHandler("update")
	public void onUpdateClick(final ClickEvent e) {
		update();
	}

	// public void setData(final String[] urls, final String visUrl, final
	// String functionName,
	// final JavaScriptObject context, final JavaScriptObject settings, final
	// JavaScriptObject data) {
	// try {
	// this.context = context;
	// this.settings = settings;
	// this.data = data;
	//
	// if (this.visUrl == null || !this.visUrl.equals(visUrl)) {
	// onLoadVisualisation();
	//
	// this.visUrl = visUrl;
	// vis = null;
	//
	// final Callback<Void, Exception> callback = new Callback<Void,
	// Exception>() {
	// @Override
	// public void onSuccess(final Void result) {
	// try {
	// vis = new Vis(functionName);
	// setWidget(vis);
	// onLoadVisualisationSuccess();
	// update();
	// } catch (final Exception e) {
	// onError(e);
	// }
	// }
	//
	// @Override
	// public void onFailure(final Exception e) {
	// onError(e);
	// }
	// };
	//
	// MultiScriptLoader.loadScripts(callback, urls);
	//
	// } else {
	// update();
	// }
	// } catch (final Exception e) {
	// onError(e);
	// }
	// }
	//
	// private void update() {
	// if (vis != null) {
	// vis.setData(context, settings, data);
	// }
	// }
	//
	// @Override
	// public void onResize() {
	// if (autoResize) {
	// resize();
	// }
	// }
	//
	// public void resize() {
	// if (vis != null) {
	// vis.resize();
	// }
	// }
	//
	// public void onLoadVisualisation() {
	// }
	//
	// public void onLoadVisualisationSuccess() {
	// }
	//
	// public void onError(final Exception e) {
	// }
	//
	// public void setAutoResize(final boolean autoResize) {
	// this.autoResize = autoResize;
	// }

	private static native JavaScriptObject getTestData(final String visType, final int pass) /*-{
		return new TestData().create(visType, pass);
	}-*/;
}
