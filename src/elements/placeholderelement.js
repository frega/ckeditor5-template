/**
 * @module template/elements/placeholder
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';

import { downcastTemplateElement, getModelAttributes } from '../utils/conversion';
import TemplateEditing from '../templateediting';

import { eventType } from '@amazee/editor-components/components/editor/operations';

/**
 * Allow to position placeholders in a document that can be filled with actual elements.
 */
export default class PlaceholderElement extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ TemplateEditing ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Placeholders should not appear in the result document, therefore they downcast to an empty string.
		// That's also the reason why they have no upcast.
		this.editor.conversion.for( 'dataDowncast' ).add( downcastTemplateElement( this.editor, {
			types: [ 'placeholder' ],
			view: ( templateElement, modelElement, viewWriter ) => {
				return viewWriter.createText( '' );
			},
		} ) );

		// Editing downcast creates a container element with a specialised ui element inside.
		this.editor.conversion.for( 'editingDowncast' ).add( downcastTemplateElement( this.editor, {
			types: [ 'placeholder' ],
			view: ( templateElement, modelElement, viewWriter ) => {
				const attributes = {
					class: 'ck-placeholder-ui',
					sections: templateElement.conversions.join( ' ' ),
				};
				const element = viewWriter.createUIElement( 'ck-placeholder', attributes );
				const wrapper = viewWriter.createContainerElement( 'div', getModelAttributes( templateElement, modelElement ) );
				viewWriter.insert( new ViewPosition( wrapper, 0 ), element );
				return toWidget( wrapper, viewWriter );
			},
		} ) );

		// Postfix elements to make sure a templates structure is always correct.
		this.editor.templates.registerPostFixer( [ 'placeholder' ], ( templateElement, item, writer ) => {
			let changed = false;
			if ( !templateElement.parent || templateElement.parent.type === 'element' ) {
				const conversions = templateElement.configuration.conversions.split( ' ' );
				if ( conversions.length == 1 ) {
					writer.insertElement( `ck__${ conversions[ 0 ] }`, item, 'before' );
					writer.setSelection( item.previousSibling, 'on' );
					writer.remove( item );
					changed = true;
				}
			}
			return changed;
		} );

		// Get all configured placeholder elements.
		const placeholderElements = this.editor.plugins.get( 'TemplateEditing' ).getElementsByType( 'placeholder' );

		// All allowed elements need to be configured to be positionable in place of the placeholder.
		for ( const templateElement of placeholderElements ) {
			for ( const el of templateElement.conversions ) {
				this.editor.model.schema.extend( `ck__${ el }`, {
					allowWhere: templateElement.name,
				} );
			}
		}
	}
}
