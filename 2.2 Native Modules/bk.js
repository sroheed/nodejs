import React from 'react'

import { connect } from 'react-redux'
import { AddEditModal } from '@opngo/organisms'
import { Button, FormError, Icon, Input, Textarea } from '@opngo/atoms'
import { FormCol, FormGroup, FormRow, MultiFieldsTable, Select } from '@opngo/molecules'
import { compose, fromRenderProps, lifecycle } from 'recompose'
import { withFormik, Form, Field, handleSubmitFacade } from '@opngo/form'

import { v4 as uuidv4 } from 'uuid'

import { FormField, SelectField } from 'lib/molecules-scu'
import { InputField } from 'lib/atoms-scu'
import { loadingIfNoDataHOC } from 'lib/hocs'

import { ModalConsumer } from 'shared'

import { SaveChangeLogPromise } from 'shared/features/itemHistory/modals'

import { EditApiActions } from '../actions'
import { EditActions } from '../reducers'
import { editSelectors } from '../selectors'


const mapStateToProps = (state) => ({
  importFormat: editSelectors.editSelector(state),
  fetching: editSelectors.fetchingSelector(state),
  objectSubTypes: editSelectors.objectSubTypesSelector(state),
  conversionTypeOptions: editSelectors.conversionTypeOptionsSelector(state),
})

const mapDispatchToProps = (dispatch, props) => ({
  fetchImportFormat: (code) => (
    dispatch(EditApiActions.fetchImportFormat, code)
  ),
  createInputFormat: (format) => (
    dispatch(EditApiActions.createInputFormat, format)
  ),
  editInputFormat: (code, format) => (
    dispatch(EditApiActions.editInputFormat, code, format)
  ),
  updateImportFormat: (format) => (
    dispatch(EditActions.setImportFormat(format))
  ),
  closeModal: () => {
    const { hideModal } = props

    hideModal()
    return dispatch(EditActions.reset())
  },
})

export const EditAddModal =
  compose(
    fromRenderProps(ModalConsumer, ({ hideModal, showModal }) => ({ hideModal, showModal })),
    connect(mapStateToProps, mapDispatchToProps),
    lifecycle({
      async componentDidMount() {
        const { code } = this.props

        await this.props.fetchImportFormat(code)
      },
    }),
    loadingIfNoDataHOC(),
    withFormik({
      mapPropsToValues: ({ importFormat }) => importFormat,
      handleSubmit: handleSubmitFacade({
        async run(values, { props }) {
          const { code } = props

          return SaveChangeLogPromise({
            callback: () => (
              !code
                ? props.createInputFormat(values)
                : props.editInputFormat(code, values)
            ),
          }, `csvImportFormat/editAddModal/${code}`)
        },
        success(values, { props }) {
          props.hideModal()
        },
      }),
    }),
  )((props) => {
    const {
      values, errors, handleSubmit, closeModal, objectSubTypes, code, conversionTypeOptions,
      setFieldValue, updateImportFormat,
    } = props
    const moveRow = (index, direction) => {
      const newStructureConversions = [...values.structureConversions]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex >= 0 && swapIndex < newStructureConversions.length) {
        const currentItem = newStructureConversions[swapIndex]

        newStructureConversions[swapIndex] = newStructureConversions[index]
        newStructureConversions[index] = currentItem
        setFieldValue('structureConversions', newStructureConversions)

        updateImportFormat({
          ...values,
          structureConversions: newStructureConversions,
        })
      }
    }

    return (
      <AddEditModal
        title={code ? 'Edit import format' : 'Add import format'}
        onCancel={closeModal}
        onConfirm={handleSubmit}
      >
        <Form>
          <FormRow gap="md">
            <FormCol>
              <FormGroup>
                <FormField label="Code" errors={errors?.code} required>
                  <Field
                    name="code"
                    component={InputField}
                    disabled={code}
                  />
                </FormField>
                <FormField label="Imported object type" errors={errors?.objectSubtype} required>
                  <Field
                    name="objectSubtype"
                    component={SelectField}
                    options={objectSubTypes}
                  />
                </FormField>
              </FormGroup>
              <FormGroup title="Structure conversions">
                <MultiFieldsTable
                  name="structureConversions"
                  errors={errors.structureConversions}
                  tableLayout
                  fields={[
                    <Select
                      key="type"
                      name="type"
                      label="Type"
                      options={conversionTypeOptions}
                      onChange={() => {}}
                      liveSearch
                    />,
                    <Textarea
                      key="config"
                      name="config"
                      defaultValue=""
                      label="Config"
                      onChange={() => {}}
                      fullWidth
                    />,
                    <div key="actions" style={{ display: 'flex', flexDirection: 'row', gap: '8px' }} label="Periority">
                      <Button size="xs" kind="text" color="secondary" onClick={() => moveRow(1, 'down')}>
                        <Icon
                          name="chevron-up"
                          size="sm"
                        />
                      </Button>
                      <Button size="xs" kind="text" color="secondary" onClick={() => moveRow(1, 'down')}>
                        <Icon
                          name="chevron-down"
                          size="sm"
                        />
                      </Button>
                    </div>,
                  ]}
                />
              </FormGroup>
              <FormError errors={errors.structureConversionsBlock} />
              <FormGroup title="Columns mapping">
                <MultiFieldsTable
                  name="columns"
                  errors={errors.columns}
                  tableLayout
                  fields={[
                    <Input
                      key="sourceColumn"
                      name="sourceColumn"
                      defaultValue=""
                      label="Source Column"
                      onChange={() => {}}
                      fullWidth
                      isRequired
                    />,
                    <Input
                      key="targetColumn"
                      name="targetColumn"
                      defaultValue=""
                      label="Target Column (if empty, then removed)"
                      onChange={() => {}}
                      fullWidth
                    />,
                    <Textarea
                      key="conversions"
                      name="conversions"
                      defaultValue=""
                      label="Conversions"
                      onChange={() => {}}
                    />,
                  ]}
                />
              </FormGroup>
              <FormError errors={errors.columnsBlock} />
            </FormCol>
          </FormRow>
        </Form>
      </AddEditModal>
    )
  })
