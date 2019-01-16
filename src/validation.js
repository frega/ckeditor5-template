import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TextLimitTooltipView from './ui/views/textlimittooltipview';
import { getOptimalPosition } from '@ckeditor/ckeditor5-utils/src/dom/position';

/**
 * Elements validation plugin.
 */
export default class Validation extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		this.tooltipView = new TextLimitTooltipView();
		this.tooltipView.set();
		this.editor.ui.view.body.add( this.tooltipView );
		this.editor.ui.focusTracker.add( this.tooltipView.element );

		// Update button positioning on any of the various occasions.
		this.listenTo( this.editor.ui, 'update', () => this._updateTooltipDisplay() );
		this.listenTo( this.editor, 'change:isReadOnly', () => this._updateTooltipDisplay() );
	}

	/**
	 * @inheritDoc
	 */
	_updateTooltipDisplay() {
		const result = this.editor.templates.findSelectedTemplateElement( info => {
			return info.configuration.validation;
		} );

		if ( !result.element || this.editor.isReadOnly ) {
			this.tooltipView.isVisible = false;
			return;
		}

		const validation = result.info.configuration.validation;

		if ( !validation ) {
			return;
		}

		const min = parseInt( result.info.configuration.min );

		this.tooltipView.isVisible = true;

		const viewElement = this.editor.editing.mapper.toViewElement( result.element );
		const domElement = this.editor.editing.view.domConverter.mapViewToDom( viewElement );
		const elementContent = domElement.innerText.replace( /[\u200B-\u200D\uFEFF]/g, '' ).trim();

		const regex = new RegExp( validation, 'gm' );
		const match = elementContent.match( regex );

		if ( ( !match && min > 1 ) || ( min > 1 && match && match.length < min ) ) {
			const length = match ? match.length : 0;
			this._showTooltip(
				this.editor.locale.t( 'Too short: please add at least %0 letters.', [ min - length ] ),
				domElement
			);
		} else if ( !match ) {
			this._showTooltip( this.editor.locale.t( 'This is a mandatory field' ), domElement );
		} else {
			this._hideTooltip( domElement );
		}
	}

	_showTooltip( message, domElement ) {
		domElement.classList.add( 'ck-required-validation-error' );
		this.tooltipView.isExceeded = true;
		this.tooltipView.set( { text: message } );

		const tooltipPosition = getOptimalPosition( {
			element: this.tooltipView.element,
			target: domElement,
			positions: [
				targetRect => ( {
					top: targetRect.top + targetRect.height,
					left: targetRect.left,
				} )
			]
		} );

		this.tooltipView.top = tooltipPosition.top;
		this.tooltipView.left = tooltipPosition.left;
	}

	_hideTooltip( domElement ) {
		domElement.classList.remove( 'ck-required-validation-error' );
		this.tooltipView.isVisible = false;
	}
}
