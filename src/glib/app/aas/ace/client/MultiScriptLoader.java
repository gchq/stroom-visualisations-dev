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

import glib.app.aas.ace.client.MyScriptInjector.FromUrl;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import com.google.gwt.core.client.Callback;

public class MultiScriptLoader {
	private static final Set<String> LOADED_URLS = new HashSet<String>();

	private static class URLCallbacks {
		final Callback<Void, Exception> parentCallback;
		final Map<String, Callback<Void, Exception>> map = new HashMap<String, Callback<Void, Exception>>();
		Exception exception;

		public URLCallbacks(final Callback<Void, Exception> parentCallback) {
			this.parentCallback = parentCallback;
		}

		public void addCallback(final String url) {
			if (!LOADED_URLS.contains(url)) {
				final Callback<Void, Exception> newCallback = new Callback<Void, Exception>() {
					@Override
					public void onSuccess(final Void result) {
						LOADED_URLS.add(url);
						map.remove(url);

						if (isComplete()) {
							if (exception != null) {
								parentCallback.onFailure(exception);
							} else {
								parentCallback.onSuccess(null);
							}
						}
					}

					@Override
					public void onFailure(final Exception e) {
						LOADED_URLS.add(url);
						map.remove(url);

						/* Only remember the first exception. */
						if (exception == null) {
							exception = e;
						}
						if (isComplete()) {
							parentCallback.onFailure(exception);
						}
					}
				};

				map.put(url, newCallback);
			}
		}

		public void inject() {
			if (isComplete()) {
				parentCallback.onSuccess(null);
			} else {
				for (final Entry<String, Callback<Void, Exception>> entry : map.entrySet()) {
					final FromUrl fromUrl = MyScriptInjector.fromUrl(entry.getKey());
					fromUrl.setCallback(entry.getValue());
					fromUrl.inject();
				}
			}
		}

		public boolean isComplete() {
			return map.size() == 0;
		}
	}

	private MultiScriptLoader() {
		// Utility.
	}

	public static void loadScripts(final Callback<Void, Exception> callback, final String... urls) {
		final URLCallbacks callbacks = new URLCallbacks(callback);
		for (final String url : urls) {
			callbacks.addCallback(url);
		}
		callbacks.inject();
	}
}
